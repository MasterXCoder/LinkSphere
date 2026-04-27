import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Monitor, MonitorOff, X, Phone, Loader2
} from 'lucide-react';
import styles from './CallModal.module.css';
import { useAuth } from '../context/AuthContext';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export default function CallModal({
  isOpen, onClose, socket, targetUser, callType, isIncoming, initialSignal, isMuted, isDeafened, onToggleMute, onToggleDeafen
}) {
  // ── UI state ─────────────────────────────────────────────────────────────
  const [callState, setCallState] = useState(isIncoming ? 'ringing' : 'calling');
  const [isVideoOff, setIsVideoOff]           = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration]               = useState(0);
  const [hasRemoteVideo, setHasRemoteVideo]   = useState(false); // got remote VIDEO track
  const [hasRemoteAudio, setHasRemoteAudio]   = useState(false); // got remote AUDIO track

  const auth = useAuth();

  // Speaking state
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const [localStreamTrigger, setLocalStreamTrigger] = useState(0);
  const [remoteStreamTrigger, setRemoteStreamTrigger] = useState(0);

  // ── Stable refs — never stale inside any callback ─────────────────────────
  const pcRef              = useRef(null);
  const localStreamRef     = useRef(null);
  const screenRef          = useRef(null);
  const iceQueueRef        = useRef([]);
  const timerRef           = useRef(null);
  const isScreenSharingRef = useRef(false);   // mirrors state for use inside onended
  const remoteStreamRef    = useRef(null);    // latest remote MediaStream

  // DOM element refs
  const localVideoRef    = useRef(null);
  const remoteVideoRef   = useRef(null);  // for the VIDEO stream
  const remoteAudioRef   = useRef(null);  // ALWAYS in DOM — plays audio for both call types

  // Latest-prop mirrors so callbacks never go stale
  const socketRef    = useRef(socket);
  const targetRef    = useRef(targetUser);
  const callTypeRef  = useRef(callType);
  const onCloseRef   = useRef(onClose);

  useEffect(() => { socketRef.current   = socket;     }, [socket]);
  useEffect(() => { targetRef.current   = targetUser; }, [targetUser]);
  useEffect(() => { callTypeRef.current = callType;   }, [callType]);
  useEffect(() => { onCloseRef.current  = onClose;    }, [onClose]);

  // keep screen-sharing ref in sync with state
  useEffect(() => { isScreenSharingRef.current = isScreenSharing; }, [isScreenSharing]);

  // ── Duration timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Callback refs for DOM elements ────────────────────────────────────────
  // Local preview
  const setLocalVideoEl = useCallback(el => {
    localVideoRef.current = el;
    if (el && localStreamRef.current) el.srcObject = localStreamRef.current;
  }, []);

  // Callback ref for remote VIDEO element
  const setRemoteVideoEl = useCallback(el => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current;
    }
  }, []);

  // Callback ref for remote AUDIO element — always in DOM
  const setRemoteAudioEl = useCallback(el => {
    remoteAudioRef.current = el;
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current;
      // Must call play() explicitly — autoPlay attr is unreliable with dynamic srcObject
      el.play().catch(e => console.warn('audio.play() blocked:', e));
    }
  }, []);

  // ── Attach remote stream to audio + video elements ────────────────────────
  const attachRemoteStream = useCallback((stream) => {
    remoteStreamRef.current = stream; // save for late-mounting elements

    // Audio element — ALWAYS attach so voice works in both call types
    const audioEl = remoteAudioRef.current;
    if (audioEl) {
      audioEl.srcObject = stream;
      // Explicit play() because autoPlay on a hidden element is unreliable
      audioEl.play().catch(e => console.warn('audio.play():', e));
    }

    // Video element — only exists for video calls
    const videoEl = remoteVideoRef.current;
    if (videoEl) {
      videoEl.srcObject = stream;
    }

    stream.getAudioTracks().forEach(() => setHasRemoteAudio(true));
    stream.getVideoTracks().forEach(() => setHasRemoteVideo(true));
    setRemoteStreamTrigger(prev => prev + 1);
  }, []);

  // ── Core helpers ──────────────────────────────────────────────────────────

  const doCleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    screenRef.current?.getTracks().forEach(t => t.stop());
    screenRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    iceQueueRef.current = [];
    remoteStreamRef.current = null;
    if (remoteAudioRef.current) { remoteAudioRef.current.srcObject = null; }
    if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = null; }
    setCallState('ended');
    setTimeout(() => onCloseRef.current?.(), 1200);
  }, []); // stable — uses only refs

  const drainIceQueue = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    while (iceQueueRef.current.length > 0) {
      const c = iceQueueRef.current.shift();
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); }
      catch (e) { console.warn('ICE drain:', e); }
    }
  }, []);

  const buildPeerConnection = useCallback(() => {
    pcRef.current?.close();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current && targetRef.current?.socketId) {
        socketRef.current.emit('ice-candidate', { candidate, to: targetRef.current.socketId });
      }
    };

    // ── THIS is where audio/video actually arrives ──
    pc.ontrack = ({ track, streams }) => {
      console.log('ontrack:', track.kind, 'streams:', streams.length);
      if (streams[0]) {
        attachRemoteStream(streams[0]);
      } else {
        // No stream object — build one manually from the track
        const existing = remoteStreamRef.current || new MediaStream();
        existing.addTrack(track);
        attachRemoteStream(existing);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE →', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallState('connected');
      }
      if (pc.iceConnectionState === 'failed') {
        setCallState('error');
        setTimeout(doCleanup, 2500);
      }
    };

    return pc;
  }, [doCleanup, attachRemoteStream]);

  const getLocalStream = useCallback(async () => {
    const isVideo = callTypeRef.current === 'video';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
      localStreamRef.current = stream;
      
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
      }
      
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setLocalStreamTrigger(prev => prev + 1);
      return stream;
    } catch (err) {
      console.error('getUserMedia failed:', err);
      // Try audio-only fallback if video fails
      if (isVideo) {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          localStreamRef.current = audioOnly;
          setLocalStreamTrigger(prev => prev + 1);
          return audioOnly;
        } catch (e2) { console.error('Audio fallback failed:', e2); }
      }
      setCallState('error');
      return null;
    }
  }, []);

  // Caller: create offer
  const startCall = useCallback(async () => {
    const stream = await getLocalStream();
    if (!stream) return;
    const pc = buildPeerConnection();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callTypeRef.current === 'video' });
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('call-user', {
        userToCall: targetRef.current?.socketId,
        signalData: offer,
        from: socketRef.current.id,
        callType: callTypeRef.current,
      });
    } catch (err) {
      console.error('createOffer failed:', err);
      setCallState('error');
    }
  }, [getLocalStream, buildPeerConnection]);

  // Callee: accept incoming offer
  const acceptCall = useCallback(async (signal) => {
    const stream = await getLocalStream();
    if (!stream) return;
    const pc = buildPeerConnection();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      await drainIceQueue();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit('accept-call', { signal: answer, to: targetRef.current?.socketId });
      // Don't force 'connected' here — let ICE state change do it naturally
    } catch (err) {
      console.error('acceptCall failed:', err);
      setCallState('error');
    }
  }, [getLocalStream, buildPeerConnection, drainIceQueue]);

  // ── Socket event handlers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onCallAccepted = async (signal) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        await drainIceQueue();
      } catch (err) {
        console.error('onCallAccepted:', err);
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const pc = pcRef.current;
      if (pc?.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (e) { console.warn('addIceCandidate:', e); }
      } else {
        iceQueueRef.current.push(candidate);
      }
    };

    const onCallRejected = () => {
      setCallState('rejected');
      setTimeout(() => onCloseRef.current?.(), 2000);
    };

    const onCallEnded = () => doCleanup();

    socket.on('call-accepted', onCallAccepted);
    socket.on('ice-candidate', onIceCandidate);
    socket.on('call-rejected', onCallRejected);
    socket.on('call-ended', onCallEnded);

    return () => {
      socket.off('call-accepted', onCallAccepted);
      socket.off('ice-candidate', onIceCandidate);
      socket.off('call-rejected', onCallRejected);
      socket.off('call-ended', onCallEnded);
    };
  }, [socket, drainIceQueue, doCleanup]);

  // ── Mount effect: start or wait ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (isIncoming && initialSignal) {
      setCallState('ringing');
    } else if (!isIncoming) {
      startCall();
    }
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
    };
  }, []); // run once

  // ── Audio Analysers for Speaking Indicators ───────────────────────────────
  useEffect(() => {
    if (!localStreamRef.current || isMuted) {
      setIsLocalSpeaking(false);
      return;
    }
    const track = localStreamRef.current.getAudioTracks()[0];
    if (!track) return;
    
    let audioCtx;
    let animationFrame;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(new MediaStream([track]));
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setIsLocalSpeaking(avg > 10);
        animationFrame = requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch (err) {
      console.error("Local audio analyser error:", err);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (audioCtx) audioCtx.close().catch(() => {});
    };
  }, [localStreamTrigger, isMuted]);

  useEffect(() => {
    if (!remoteStreamRef.current || isDeafened) {
      setIsRemoteSpeaking(false);
      return;
    }
    const track = remoteStreamRef.current.getAudioTracks()[0];
    if (!track) return;

    let audioCtx;
    let animationFrame;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(new MediaStream([track]));
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setIsRemoteSpeaking(avg > 10);
        animationFrame = requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch (err) {
      console.error("Remote audio analyser error:", err);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (audioCtx) audioCtx.close().catch(() => {});
    };
  }, [remoteStreamTrigger, isDeafened]);

  // ── Controls ──────────────────────────────────────────────────────────────
  // React to global mute state
  useEffect(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !isMuted;
    }
  }, [isMuted]);

  // React to global deafen state
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isDeafened;
    }
  }, [isDeafened]);

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
  };

  // ── Screen share — uses ref to avoid stale closure in onended ────────────
  const stopScreenShare = useCallback(() => {
    screenRef.current?.getTracks().forEach(t => t.stop());
    screenRef.current = null;
    // Restore camera track in sender
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
    if (sender && camTrack) {
      sender.replaceTrack(camTrack);
    }
    // Restore local preview
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    setIsScreenSharing(false);
    isScreenSharingRef.current = false;
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenRef.current = ss;
      const screenTrack = ss.getVideoTracks()[0];

      // Replace video track in the peer connection
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      } else {
        // No existing video sender (audio-only call) — add a new track
        if (pcRef.current) pcRef.current.addTrack(screenTrack, ss);
      }

      // Show screen in local preview
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = ss;
      }

      // Use ref-based callback so onended is never stale
      screenTrack.onended = () => {
        if (isScreenSharingRef.current) stopScreenShare();
      };

      setIsScreenSharing(true);
      isScreenSharingRef.current = true;
    } catch (e) {
      console.error('getDisplayMedia failed:', e);
    }
  }, [stopScreenShare]);

  const toggleScreenShare = () => {
    if (isScreenSharingRef.current) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const handleEndCall = () => {
    socketRef.current?.emit('end-call', { to: targetRef.current?.socketId });
    doCleanup();
  };

  const handleReject = () => {
    socketRef.current?.emit('reject-call', { to: targetRef.current?.socketId });
    doCleanup();
  };

  if (!isOpen) return null;

  const isVideoCall = callType === 'video';

  const voicePortalTarget = document.getElementById('voice-controls-portal');
  const videoPortalTarget = document.getElementById('main-video-portal');

  // Always render the hidden remote audio element
  const audioEl = (
    <audio
      ref={setRemoteAudioEl}
      playsInline
      style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
    />
  );

  // If ringing, show the incoming overlay
  if (callState === 'ringing') {
    return (
      <div className={styles.incomingOverlay}>
        {audioEl}
        <div className={styles.incomingModal}>
          <div className={styles.incomingAvatar} style={targetUser?.avatarUrl ? { backgroundImage: `url(${targetUser.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}>
            {!targetUser?.avatarUrl && (targetUser?.username?.charAt(0).toUpperCase() || '?')}
          </div>
          <div className={styles.incomingInfo}>
            <div className={styles.incomingName}>{targetUser?.username || 'Unknown'}</div>
            <div className={styles.incomingType}>Incoming {callType} call</div>
          </div>
          <div className={styles.incomingActions}>
            <button className={`${styles.actionBtn} ${styles.accept}`} onClick={() => acceptCall(initialSignal)} title="Accept">
              <Phone size={24} />
            </button>
            <button className={`${styles.actionBtn} ${styles.reject}`} onClick={handleReject} title="Decline">
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Voice Connected Sidebar Panel
  const voiceConnectedPanel = voicePortalTarget ? createPortal(
    <div className={styles.voiceConnectedPanel}>
      <div className={styles.voiceConnectedHeader}>
        <div className={styles.voiceConnectedHeaderLeft} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={styles.voiceConnectedSignalBox}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M11 2.008C11 1.452 11.448 1 12 1c5.523 0 10 4.477 10 10s-4.477 10-10 10c-.552 0-1-.448-1-1v-1.008a8.001 8.001 0 0 1-7-7.992V11c0-.552.448-1 1-1h1.008a6.001 6.001 0 0 0 5.992 5.992V17c0 .552.448 1 1 1a4 4 0 0 0 4-4c0-.552-.448-1-1-1h-1.008a2.001 2.001 0 0 1-1.992-1.992V11c0-.552.448-1 1-1A4 4 0 0 0 11 14v1.008zM12 4a6 6 0 0 1 6 6h-2a4 4 0 0 0-4-4V4zM4.27 3.518A9.965 9.965 0 0 0 2 11v2a9.965 9.965 0 0 0 2.27 6.482l1.414-1.414A7.971 7.971 0 0 1 4 13v-2c0-1.84.62-3.535 1.684-4.896L4.27 3.518z" />
            </svg>
          </div>
          <div className={styles.voiceConnectedText}>
            <div className={styles.voiceConnectedStatus}>Voice Connected</div>
            <div className={styles.voiceConnectedChannel}>
              General / {targetUser?.username || 'Call'}
            </div>
          </div>
        </div>
        <div className={styles.voiceConnectedHeaderRight}>
          <button className={styles.disconnectBtn} title="Noise Suppression">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v3"></path><path d="M6 6v11"></path><path d="M10 3v18"></path><path d="M14 8v7"></path><path d="M18 5v13"></path><path d="M22 10v3"></path></svg>
          </button>
          <button className={styles.disconnectBtn} onClick={handleEndCall} title="Disconnect">
            <PhoneOff size={20} />
          </button>
        </div>
      </div>

      <div className={styles.voiceConnectedActions}>
        <button className={`${styles.panelBtn} ${isVideoOff ? styles.active : ''}`} onClick={toggleVideo} title="Camera">
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
        <button className={`${styles.panelBtn} ${isScreenSharing ? styles.active : ''}`} onClick={toggleScreenShare} title="Share Your Screen">
          {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>
        <button className={`${styles.panelBtn} ${isMuted ? styles.active : ''}`} onClick={onToggleMute} title={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button className={`${styles.panelBtn} ${isDeafened ? styles.active : ''}`} onClick={onToggleDeafen} title={isDeafened ? "Undeafen" : "Deafen"}>
          {isDeafened ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.9 13.5a10.02 10.02 0 0 0-2.43-8.83M5.1 10.5A10 10 0 0 0 12 22"></path><path d="M9 18a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3"></path><path d="M15 12a3 3 0 0 1 3 3v2.85"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
          )}
        </button>
      </div>
    </div>,
    voicePortalTarget
  ) : null;

  // Video/Voice Grid in Main Area
  const videoPortal = videoPortalTarget ? createPortal(
    <div className={styles.mainVideoPortal}>
      <div className={styles.callGrid}>
        {/* Remote Tile */}
        <div className={`${styles.gridTile} ${isRemoteSpeaking && hasRemoteVideo ? styles.isSpeakingVideo : ''}`}>
          <video
            ref={setRemoteVideoEl}
            autoPlay
            playsInline
            className={`${styles.remoteVideo} ${!hasRemoteVideo ? styles.hidden : ''}`}
          />
          {!hasRemoteVideo && (
            <>
              <div className={`${styles.tileAvatar} ${isRemoteSpeaking ? styles.isSpeaking : ''}`} style={targetUser?.avatarUrl ? { backgroundImage: `url(${targetUser.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}>
                {!targetUser?.avatarUrl && (targetUser?.username?.charAt(0).toUpperCase() || '?')}
              </div>
              {callState === 'connected' && (
                <div className={styles.waitingOverlayAudio}>
                  <span>Voice Connected</span>
                </div>
              )}
            </>
          )}
          <div className={styles.tileName}>{targetUser?.username || 'Remote User'}</div>
        </div>

        {/* Local Tile */}
        {(() => {
          const hasLocalVideoTrack = localStreamRef.current?.getVideoTracks().length > 0;
          const showLocalAvatar = !isScreenSharing && (!hasLocalVideoTrack || isVideoOff);
          return (
            <div className={`${styles.gridTile} ${isLocalSpeaking && !showLocalAvatar ? styles.isSpeakingVideo : ''}`}>
              <video
                ref={setLocalVideoEl}
                autoPlay
                playsInline
                muted
                className={`${styles.localVideo} ${showLocalAvatar ? styles.hidden : ''}`}
              />
              {showLocalAvatar && (
                <div className={`${styles.tileAvatar} ${isLocalSpeaking ? styles.isSpeaking : ''}`} style={auth?.user?.avatarUrl ? { backgroundImage: `url(${auth.user.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : { background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
                  {!auth?.user?.avatarUrl && "You"}
                </div>
              )}
              <div className={styles.tileName}>You</div>
            </div>
          );
        })()}
      </div>

      {/* Bottom Controls Area */}
      <div className={styles.bottomControls}>
        <div className={styles.controlGroup}>
          <button className={`${styles.controlBtn} ${isMuted ? styles.danger : ''}`} onClick={onToggleMute} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button className={`${styles.controlBtn} ${isVideoOff ? styles.danger : ''}`} onClick={toggleVideo} title="Camera">
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        </div>

        <div className={styles.controlGroup}>
          <button className={`${styles.controlBtn} ${isScreenSharing ? styles.active : ''}`} onClick={toggleScreenShare} title="Share Screen">
            {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>
          <button className={`${styles.controlBtn} ${isDeafened ? styles.danger : ''}`} onClick={onToggleDeafen} title="Deafen">
            {isDeafened ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.9 13.5a10.02 10.02 0 0 0-2.43-8.83M5.1 10.5A10 10 0 0 0 12 22"></path><path d="M9 18a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3"></path><path d="M15 12a3 3 0 0 1 3 3v2.85"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
            )}
          </button>
        </div>

        <button className={styles.endCallBtnBig} onClick={handleEndCall} title="Disconnect">
          <PhoneOff size={22} />
        </button>
      </div>
    </div>,
    videoPortalTarget
  ) : null;

  return (
    <>
      {audioEl}
      {voiceConnectedPanel}
      {videoPortal}
    </>
  );
}
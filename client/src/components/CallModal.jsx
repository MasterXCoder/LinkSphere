import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Monitor, MonitorOff, X, Phone, Loader2
} from 'lucide-react';
import styles from './CallModal.module.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export default function CallModal({
  isOpen, onClose, socket, targetUser, callType, isIncoming, initialSignal,
}) {
  // ── UI state ─────────────────────────────────────────────────────────────
  const [callState, setCallState] = useState(isIncoming ? 'ringing' : 'calling');
  const [isMuted, setIsMuted]                 = useState(false);
  const [isVideoOff, setIsVideoOff]           = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration]               = useState(0);
  const [hasRemoteVideo, setHasRemoteVideo]   = useState(false); // got remote VIDEO track
  const [hasRemoteAudio, setHasRemoteAudio]   = useState(false); // got remote AUDIO track

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
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
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

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

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

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* ── Remote audio element — always in DOM, always active ── */}
        {/* Use position/size hide NOT display:none — display:none can suppress audio autoplay */}
        <audio
          ref={setRemoteAudioEl}
          playsInline
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />

        {/* ── Header ──────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.callMeta}>
            <div className={styles.avatar}>
              {targetUser?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div className={styles.callerName}>{targetUser?.username || 'Unknown'}</div>
              <div className={styles.callStatus}>
                {callState === 'calling'   && 'Calling…'}
                {callState === 'ringing'   && `Incoming ${callType} call`}
                {callState === 'connected' && fmt(duration)}
                {callState === 'rejected'  && 'Call rejected'}
                {callState === 'ended'     && 'Call ended'}
                {callState === 'error'     && 'Connection failed'}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleEndCall} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* ── Video area — only for video calls ───────────── */}
        {isVideoCall && (
          <div className={styles.videoArea}>
            {/* Remote video */}
            <video
              ref={setRemoteVideoEl}
              autoPlay
              playsInline
              className={styles.remoteVideo}
            />
            {!hasRemoteVideo && callState === 'connected' && (
              <div className={styles.waitingOverlay}>
                <Loader2 size={32} className={styles.spin} />
                <span>Waiting for video…</span>
              </div>
            )}

            {/* Local preview — shows camera OR screen share */}
            <video
              ref={setLocalVideoEl}
              autoPlay
              playsInline
              muted
              className={`${styles.localVideo} ${isVideoOff && !isScreenSharing ? styles.hidden : ''}`}
            />
          </div>
        )}

        {/* ── Audio-only: big avatar ────────────────────────── */}
        {!isVideoCall && callState !== 'ended' && callState !== 'error' && (
          <div className={styles.audioArea}>
            <div className={`${styles.avatarLarge} ${callState === 'calling' || callState === 'ringing' ? styles.pulse : ''}`}>
              {targetUser?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            {callState === 'connected' && (
              <div className={styles.connectedLabel}>
                <span className={styles.connectedDot} />
                {fmt(duration)}
              </div>
            )}
            {(callState === 'calling' || callState === 'ringing') && (
              <div className={styles.dots}>
                <span /><span /><span />
              </div>
            )}
          </div>
        )}

        {/* ── Error / ended ────────────────────────────────── */}
        {(callState === 'error' || callState === 'rejected') && (
          <div className={styles.errorArea}>
            <p>{callState === 'error' ? '⚠️ Connection failed' : '❌ Call rejected'}</p>
          </div>
        )}

        {/* ── Controls ─────────────────────────────────────── */}
        <div className={styles.controls}>
          {callState === 'ringing' && (
            <>
              <button className={`${styles.ctrlBtn} ${styles.accept}`} onClick={() => acceptCall(initialSignal)} title="Accept">
                <Phone size={22} />
              </button>
              <button className={`${styles.ctrlBtn} ${styles.reject}`} onClick={handleReject} title="Decline">
                <PhoneOff size={22} />
              </button>
            </>
          )}

          {(callState === 'calling' || callState === 'connected') && (
            <>
              <button className={`${styles.ctrlBtn} ${isMuted ? styles.active : ''}`} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              {isVideoCall && (
                <>
                  <button className={`${styles.ctrlBtn} ${isVideoOff ? styles.active : ''}`} onClick={toggleVideo} title={isVideoOff ? 'Camera On' : 'Camera Off'}>
                    {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                  </button>
                  <button className={`${styles.ctrlBtn} ${isScreenSharing ? styles.active : ''}`} onClick={toggleScreenShare} title={isScreenSharing ? 'Stop Share' : 'Share Screen'}>
                    {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
                  </button>
                </>
              )}

              <button className={`${styles.ctrlBtn} ${styles.reject}`} onClick={handleEndCall} title="End Call">
                <PhoneOff size={22} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
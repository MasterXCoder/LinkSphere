import { useState, useEffect, useRef } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export default function useVoiceChannel(socket, roomId, isMuted, user) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [speakingUsers, setSpeakingUsers] = useState({});
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peersRef = useRef({});
  const iceQueuesRef = useRef({});
  const localStreamRef = useRef(null);

  // Initialize microphone when entering a room
  useEffect(() => {
    if (!roomId) {
      // Clean up EVERYTHING when leaving a room
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      iceQueuesRef.current = {};
      setTimeout(() => {
        setRemoteStreams({});
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop());
          localStreamRef.current = null;
          setLocalStream(null);
        }
      }, 0);
      return;
    }

    let isMounted = true;
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then(stream => {
        if (!isMounted) {
           stream.getTracks().forEach(t => t.stop());
           return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Emit join-voice ONLY AFTER we have successfully captured local media tracks.
        // This prevents the race condition where we receive `call-incoming` before `localStreamRef` is populated.
        if (socket && user) {
          socket.emit("join-voice", { channelId: roomId, user: { ...user, socketId: socket.id } });
        }
      })
      .catch(err => {
        console.error("Mic access denied", err);
      });

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // Handle local mute
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Handle Socket Signaling for Mesh WebRTC
  useEffect(() => {
    if (!socket || !roomId || !localStream) return;

    // Helper to create PeerConnection
    const createPeer = (targetSocketId) => {
      if (peersRef.current[targetSocketId]) {
        return peersRef.current[targetSocketId];
      }
      
      iceQueuesRef.current[targetSocketId] = [];
      const pc = new RTCPeerConnection(ICE_SERVERS);
      
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit('ice-candidate', { candidate, to: targetSocketId, isVoiceChannel: true });
        }
      };

      pc.ontrack = ({ track, streams }) => {
        const stream = streams[0] || new MediaStream();
        if (!streams[0]) stream.addTrack(track);

        const updateStream = () => {
          setRemoteStreams(prev => {
            const current = prev[targetSocketId] || new MediaStream();
            
            // If it's a new track, add it
            if (!current.getTracks().includes(track)) {
              current.addTrack(track);
            }
            
            // CRITICAL FIX: Always filter out tracks that are completely 'ended' or disconnected
            // so the <video> element doesn't get stuck playing a dead track!
            const validTracks = current.getTracks().filter(t => t.readyState === 'live');
            
            // If the valid tracks are different from the current tracks, update the stream
            if (validTracks.length !== current.getTracks().length) {
              return { ...prev, [targetSocketId]: new MediaStream(validTracks) };
            }

            return {
              ...prev,
              [targetSocketId]: new MediaStream(current.getTracks())
            };
          });
        };

        stream.onaddtrack = updateStream;
        stream.onremovetrack = updateStream;
        track.onunmute = updateStream;
        track.onmute = updateStream;
        track.onended = () => {
           // Forcefully remove the dead track from the stream when it ends
           setRemoteStreams(prev => {
             const current = prev[targetSocketId];
             if (current) {
               const activeTracks = current.getTracks().filter(t => t.id !== track.id && t.readyState === 'live');
               return { ...prev, [targetSocketId]: new MediaStream(activeTracks) };
             }
             return prev;
           });
        };
        
        updateStream();
      };

      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('renegotiate-mesh', { to: targetSocketId, signal: offer, from: socket.id });
        } catch (err) {
          console.error(err);
        }
      };

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
      }
      
      peersRef.current[targetSocketId] = pc;
      return pc;
    };

    const drainIceQueue = async (targetSocketId, pc) => {
      const queue = iceQueuesRef.current[targetSocketId];
      if (!queue || !pc.remoteDescription) return;
      while (queue.length > 0) {
        const candidate = queue.shift();
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (err) { console.warn("Drain ice candidate error", err); }
      }
    };

    // 1. Another user joined the room
    const handleUserJoinedVoice = async ({ channelId, user }) => {
      if (channelId !== roomId) return;
      if (user.socketId === socket.id) return;
      
      const pc = createPeer(user.socketId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call-user', {
          userToCall: user.socketId,
          signalData: offer,
          from: socket.id,
          callType: 'audio',
          isVoiceChannel: true
        });
      } catch (err) {
        console.error("Error creating offer for new joiner", err);
      }
    };

    // 2. We received an offer from someone in the room
    const handleCallIncoming = async ({ signal, from, isVoiceChannel }) => {
      if (!isVoiceChannel) return; // Ignore private calls
      
      const pc = createPeer(from);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        await drainIceQueue(from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('accept-call', {
          signal: answer,
          to: from,
          isVoiceChannel: true
        });
      } catch (err) {
        console.error("Error accepting room call", err);
      }
    };

    // 3. The person we called answered
    // Note: server.js must emit "call-accepted" as an object with { signal, from, isVoiceChannel }
    const handleCallAccepted = async (data) => {
      // Handle both old format (just signal) and new format (object)
      const signal = data.signal || data;
      const from = data.from;
      const isVoiceChannel = data.isVoiceChannel;
      
      if (!isVoiceChannel || !from) return;
      
      const pc = peersRef.current[from];
      if (pc && pc.signalingState !== 'stable') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          await drainIceQueue(from, pc);
        } catch (err) {
          console.error("Error setting remote desc on accept", err);
        }
      }
    };

    // 4. Handle ICE candidates
    const handleIceCandidate = async (data) => {
      const candidate = data.candidate;
      const from = data.from;
      const isVoiceChannel = data.isVoiceChannel;
      
      if (!isVoiceChannel || !from) return;
      
      const pc = peersRef.current[from];
      if (pc) {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding ice candidate", err);
          }
        } else {
          if (!iceQueuesRef.current[from]) iceQueuesRef.current[from] = [];
          iceQueuesRef.current[from].push(candidate);
        }
      }
    };

    // 5. Handle user leaving
    const handleUserLeftVoice = ({ channelId, socketId }) => {
      if (channelId !== roomId) return;
      
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      
      setRemoteStreams(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    // 6. Handle renegotiation
    const handleRenegotiate = async ({ signal, from }) => {
      const pc = peersRef.current[from];
      if (!pc) return;
      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          await drainIceQueue(from, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('renegotiate-mesh', { to: from, signal: answer, from: socket.id });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          await drainIceQueue(from, pc);
        }
      } catch (err) {
        console.error("Error during renegotiation", err);
      }
    };

    socket.on('user-joined-voice', handleUserJoinedVoice);
    socket.on('call-incoming', handleCallIncoming);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-left-voice', handleUserLeftVoice);
    socket.on('renegotiate-mesh', handleRenegotiate);

    return () => {
      socket.off('user-joined-voice', handleUserJoinedVoice);
      socket.off('call-incoming', handleCallIncoming);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-left-voice', handleUserLeftVoice);
      socket.off('renegotiate-mesh', handleRenegotiate);
    };
  }, [socket, roomId, localStream]);

  // Handle Speaking Detection
  useEffect(() => {
    if (!socket?.id) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const timers = [];

    const setupAnalyser = (stream, socketId) => {
      if (!stream || stream.getAudioTracks().length === 0) return;
      try {
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAudio = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          
          setSpeakingUsers(prev => {
            const isSpeaking = avg > 15;
            if (prev[socketId] !== isSpeaking) {
              return { ...prev, [socketId]: isSpeaking };
            }
            return prev;
          });
          timers.push(requestAnimationFrame(checkAudio));
        };
        checkAudio();
      } catch (err) {
        console.error("Audio analyser error:", err);
      }
    };

    if (localStream && !isMuted) {
      setupAnalyser(localStream, socket.id);
    } else {
      setTimeout(() => {
        setSpeakingUsers(prev => ({ ...prev, [socket.id]: false }));
      }, 0);
    }

    Object.entries(remoteStreams).forEach(([socketId, stream]) => {
      setupAnalyser(stream, socketId);
    });

    return () => {
      timers.forEach(t => cancelAnimationFrame(t));
      if (audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [socket, localStream, remoteStreams, isMuted]);

  const toggleVideo = async () => {
    if (!localStreamRef.current) return;
    try {
      if (isVideoOn) {
        // Stop video
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          await Promise.all(Object.values(peersRef.current).map(async pc => {
             const transceiver = pc.getTransceivers().find(t => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video');
             if (transceiver && transceiver.sender) {
               await transceiver.sender.replaceTrack(null);
               // Downgrade direction to stop sending, but keep receiving if the other person is sending
               if (transceiver.currentDirection === 'sendrecv') transceiver.direction = 'recvonly';
               if (transceiver.currentDirection === 'sendonly') transceiver.direction = 'inactive';
             }
          }));
          videoTrack.stop();
          localStreamRef.current.removeTrack(videoTrack);
        }
        setIsVideoOn(false);
      } else {
        // Start video
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
        const videoTrack = stream.getVideoTracks()[0];
        
        const existingVideo = localStreamRef.current.getVideoTracks()[0];
        
        // Use replaceTrack for safety if sender exists
        await Promise.all(Object.values(peersRef.current).map(async pc => {
          // Find any video transceiver
          const transceiver = pc.getTransceivers().find(t => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video');
          if (transceiver && transceiver.sender) {
            // CRITICAL FIX: If we were previously only receiving video (recvonly), 
            // we MUST upgrade the direction to 'sendrecv' before replacing the track,
            // otherwise WebRTC will silently drop all our outgoing video frames!
            transceiver.direction = 'sendrecv';
            await transceiver.sender.replaceTrack(videoTrack);
            // Force renegotiation to update bandwidth/resolution limits!
            if (pc.signalingState === 'stable') pc.onnegotiationneeded?.();
          } else {
            pc.addTrack(videoTrack, localStreamRef.current);
          }
        }));

        // Stop existing video ONLY AFTER replacing is fully complete!
        if (existingVideo) {
          existingVideo.stop();
          localStreamRef.current.removeTrack(existingVideo);
        }

        localStreamRef.current.addTrack(videoTrack);
        setIsVideoOn(true);
        if (isScreenSharing) {
          setIsScreenSharing(false);
        }
      }
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (err) {
      console.error("Failed to toggle video", err);
    }
  };

  const toggleScreenShare = async () => {
    if (!localStreamRef.current) return;
    try {
      if (isScreenSharing) {
        // Stop screen share
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          await Promise.all(Object.values(peersRef.current).map(async pc => {
             const transceiver = pc.getTransceivers().find(t => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video');
             if (transceiver && transceiver.sender) {
               await transceiver.sender.replaceTrack(null);
               if (transceiver.currentDirection === 'sendrecv') transceiver.direction = 'recvonly';
               if (transceiver.currentDirection === 'sendonly') transceiver.direction = 'inactive';
             }
          }));
          videoTrack.stop();
          localStreamRef.current.removeTrack(videoTrack);
        }
        setIsScreenSharing(false);
      } else {
        // Start screen share
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const videoTrack = stream.getVideoTracks()[0];
        
        const existingVideo = localStreamRef.current.getVideoTracks()[0];
        
        // Use replaceTrack for safety if sender exists
        await Promise.all(Object.values(peersRef.current).map(async pc => {
          const transceiver = pc.getTransceivers().find(t => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video');
          if (transceiver && transceiver.sender) {
            // CRITICAL FIX: Upgrade direction to allow outgoing frames!
            transceiver.direction = 'sendrecv';
            await transceiver.sender.replaceTrack(videoTrack);
            // Force renegotiation to update bandwidth/resolution limits!
            if (pc.signalingState === 'stable') pc.onnegotiationneeded?.();
          } else {
            pc.addTrack(videoTrack, localStreamRef.current);
          }
        }));

        // Stop existing video ONLY AFTER replacing is fully complete!
        if (existingVideo) {
          existingVideo.stop();
          localStreamRef.current.removeTrack(existingVideo);
        }

        localStreamRef.current.addTrack(videoTrack);

        videoTrack.onended = () => {
          setIsScreenSharing(false);
          Object.values(peersRef.current).forEach((pc, index) => {
             const targetSocketId = Object.keys(peersRef.current)[index];
             socket.emit('toggle-screen-share', { to: targetSocketId, isScreenSharing: false });
          });
          if (localStreamRef.current) {
            Object.values(peersRef.current).forEach(async pc => {
               const transceiver = pc.getTransceivers().find(t => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video');
               if (transceiver && transceiver.sender) {
                 await transceiver.sender.replaceTrack(null);
                 if (transceiver.currentDirection === 'sendrecv') transceiver.direction = 'recvonly';
                 if (transceiver.currentDirection === 'sendonly') transceiver.direction = 'inactive';
               }
            });
            localStreamRef.current.removeTrack(videoTrack);
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          }
        };

        setIsScreenSharing(true);
        Object.values(peersRef.current).forEach((pc, index) => {
           const targetSocketId = Object.keys(peersRef.current)[index];
           socket.emit('toggle-screen-share', { to: targetSocketId, isScreenSharing: true });
        });
        setIsVideoOn(false);
      }
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (err) {
      console.error("Failed to toggle screen share", err);
    }
  };

  return { localStream, remoteStreams, speakingUsers, isVideoOn, isScreenSharing, toggleVideo, toggleScreenShare };
}

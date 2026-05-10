import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import { useAuth } from '../context/AuthContext';
import CreateServerModal from '../components/CreateServerModal';
import EditServerModal from '../components/EditServerModal';
import Logo from '../components/Logo';
import CallModal from '../components/CallModal';
import styles from "./AppPage.module.css";
import callStyles from "../components/CallModal.module.css";
import UserSettings from "./UserSettings";
import useVoiceChannel from '../hooks/useVoiceChannel';
import { Mic, MicOff, PhoneOff, Video, VideoOff, Monitor, MonitorOff, Phone } from 'lucide-react';

const API = "/api";

// Status config — defined at module level so it's stable across renders
const STATUSES = {
  online: { label: 'Online', dot: '#22c55e', indicatorColor: '#22c55e' },
  idle: { label: 'Idle', dot: '#f59e0b', indicatorColor: '#f59e0b' },
  dnd: { label: 'Do Not Disturb', dot: '#ef4444', indicatorColor: '#ef4444' },
  invisible: { label: 'Invisible', dot: '#6b7280', indicatorColor: '#6b7280' },
};

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function AppPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { user, token } = auth;
  const username = user?.username || "User";
  const userId = user?.id || 0;

  // ── Refs ──
  const chatEndRef = useRef(null);
  const pollRef = useRef(null);
  const userPopupRef = useRef(null);
  const mainAreaRef = useRef(null); // Ref for tracking cursor position
  const targetUserRef = useRef(null);
  const serverDataRef = useRef(null);

  const [socket, setSocket] = useState(null);

  // Initialize socket
  useEffect(() => {
    if (token) {
      const newSocket = io("", {
        auth: { token, username },
      });

      setSocket(newSocket);

      // Call events
      newSocket.on("call-incoming", ({ signal, from, callType: incomingCallType, callerName, callerAvatar, isVoiceChannel }) => {
        if (isVoiceChannel) return; // Handled by useVoiceChannel hook
        const members = serverDataRef.current?.membersData || [];
        const caller = members.find(m => m.socketId === from);
        setTargetUser({ 
          id: caller?.id,
          socketId: from, 
          username: caller?.username || callerName || 'Unknown',
          avatarUrl: caller?.avatarUrl || callerAvatar
        });
        setIncomingCall(signal);
        setCallType(incomingCallType || 'audio');
        setIsCallModalOpen(true);
      });

      newSocket.on("call-rejected", () => {
        setIsCallModalOpen(false);
        setTargetUser(null);
        setIncomingCall(null);
      });

      newSocket.on("call-ended", () => {
        setIsCallModalOpen(false);
        setTargetUser(null);
        setIncomingCall(null);
      });

      newSocket.on("user-left-call", ({ userId: leftUserId }) => {
        if (targetUserRef.current?.id === leftUserId) {
          setIsCallModalOpen(false);
          setTargetUser(null);
          setIncomingCall(null);
        }
      });

      newSocket.on("user-online", ({ userId, socketId }) => {
        setOnlineUsers(prev => ({ ...prev, [userId]: socketId }));
      });

      // Bulk snapshot of all currently-online users sent on connect
      newSocket.on("online-users-list", (onlineList) => {
        const onlineMap = {};
        onlineList.forEach(({ userId: uid, socketId: sid }) => {
          onlineMap[uid] = sid;
        });
        setOnlineUsers(onlineMap);
      });

      newSocket.on("user-offline", ({ userId }) => {
        setOnlineUsers(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      });

      newSocket.on("voice-users-update", ({ channelId, users }) => {
        setVoiceUsers(prev => ({ ...prev, [channelId]: users }));
      });

      newSocket.on("force-disconnect-voice", () => {
        setJoinedVoiceChannel(null);
      });

      return () => newSocket.close();
    }
  }, [token]);

  // ── State ──
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState("home");
  const [serverData, setServerData] = useState(null); // full server details + members
  const [onlineUsers, setOnlineUsers] = useState({}); // userId -> socketId
  
  // Sync refs
  useEffect(() => {
    serverDataRef.current = serverData;
  }, [serverData]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [friendInput, setFriendInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isEditServerModalOpen, setIsEditServerModalOpen] = useState(false);

  // Channel Creation State
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState("text");

  const [voiceUsers, setVoiceUsers] = useState({});
  const [joinedVoiceChannel, setJoinedVoiceChannel] = useState(null);

  const [showServerMenu, setShowServerMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('online');

  // Global Audio States
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Attachment State
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  // Call State
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState('audio');
  const [targetUser, setTargetUser] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  // Use Voice Channel Hook
  const { remoteStreams, localStream, speakingUsers, isVideoOn, isScreenSharing, toggleVideo, toggleScreenShare } = useVoiceChannel(socket, joinedVoiceChannel, isMuted, auth?.user);

  // Friend system state
  const [activeHomeTab, setActiveHomeTab] = useState('addFriend');
  const [friendsData, setFriendsData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [friendRequestStatus, setFriendRequestStatus] = useState('');
  const [friendRequestMsg, setFriendRequestMsg] = useState('');

  // Sync ref
  useEffect(() => {
    targetUserRef.current = targetUser;
  }, [targetUser]);

  // ── Friend System ──
  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch(`${API}/friends`, { headers: authHeaders(token) });
      if (res.ok) {
        const data = await res.json();
        setFriendsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    }
  }, [token]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  // Re-fetch friends when switching tabs or periodically for real-time updates
  useEffect(() => {
    if (activeServer === "home") {
      fetchFriends();
      const interval = setInterval(fetchFriends, 5000);
      return () => clearInterval(interval);
    }
  }, [activeHomeTab, activeServer, fetchFriends]);

  const handleSendFriendRequest = async () => {
    if (!friendInput.trim()) return;
    setFriendRequestStatus('');
    setFriendRequestMsg('');
    try {
      const res = await fetch(`${API}/friends/request`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ toUsername: friendInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setFriendRequestStatus('success');
        setFriendRequestMsg(data.message || `Friend request sent to \"${friendInput}\"`);
        setFriendInput('');
        fetchFriends();
      } else {
        setFriendRequestStatus('error');
        setFriendRequestMsg(data.error || "Failed to send request");
      }
    } catch (err) {
      setFriendRequestStatus('error');
      setFriendRequestMsg("Could not connect to server");
    }
  };

  const handleAcceptFriend = async (fromId) => {
    try {
      await fetch(`${API}/friends/accept`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ fromId }),
      });
      fetchFriends();
    } catch (err) {
      console.error("Failed to accept friend:", err);
    }
  };

  const handleDeclineFriend = async (fromId) => {
    try {
      await fetch(`${API}/friends/decline`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ fromId }),
      });
      fetchFriends();
    } catch (err) {
      console.error("Failed to decline friend:", err);
    }
  };

  const handleCancelFriend = async (toId) => {
    try {
      await fetch(`${API}/friends/cancel`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ toId }),
      });
      fetchFriends();
    } catch (err) {
      console.error("Failed to cancel request:", err);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await fetch(`${API}/friends/${friendId}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      fetchFriends();
    } catch (err) {
      console.error("Failed to remove friend:", err);
    }
  };

  // ── Interaction Logic ──
  const handleMouseMove = (e) => {
    if (!mainAreaRef.current) return;
    const { left, top } = mainAreaRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    // Set CSS variables for the dynamic glow effect
    mainAreaRef.current.style.setProperty('--mouse-x', `${x}px`);
    mainAreaRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const selectStatus = (key) => {
    setCurrentStatus(key);
    setShowStatusSubmenu(false);
  };

  // Handle Create Channel
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const res = await fetch(`${API}/servers/${activeServer}/channels`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ name: newChannelName, type: newChannelType }),
      });

      if (res.ok) {
        setNewChannelName("");
        setNewChannelType("text");
        setIsChannelModalOpen(false);
        // Re-fetch server data to show the new channel in list
        const resData = await fetch(`${API}/servers/${activeServer}`, { headers: authHeaders(token) });
        if (resData.ok) {
          const data = await resData.json();
          setServerData(data);
        }
        setToast("Channel created!");
        setTimeout(() => setToast(""), 2000);
      }
    } catch (err) {
      console.error("Failed to create channel:", err);
    }
  };

  // NEW: Handle Delete Channel
  const handleDeleteChannel = async (e, channelId) => {
    e.stopPropagation(); // Prevent switching to the channel when clicking delete
    if (!serverData || serverData.ownerId !== userId) return;
    if (!window.confirm("Are you sure you want to delete this channel?")) return;

    try {
      const res = await fetch(`${API}/servers/${activeServer}/channels/${channelId}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });

      if (res.ok) {
        if (activeChannel === channelId) {
          setActiveChannel(null);
        }
        // Re-fetch server data to update the UI
        const resData = await fetch(`${API}/servers/${activeServer}`, { headers: authHeaders(token) });
        if (resData.ok) {
          const data = await resData.json();
          setServerData(data);
        }
        setToast("Channel deleted!");
        setTimeout(() => setToast(""), 2000);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete channel");
      }
    } catch (err) {
      console.error("Failed to delete channel:", err);
    }
  };

  const handleJoinVoiceChannel = (channelId) => {
    if (isCallModalOpen) {
      alert('Please end your current private call before joining a voice channel.');
      return;
    }
    if (joinedVoiceChannel) {
      socket?.emit("leave-voice", { channelId: joinedVoiceChannel });
    }
    setJoinedVoiceChannel(channelId);
  };

  const handleDisconnectVoice = () => {
    if (joinedVoiceChannel) {
      socket?.emit("leave-voice", { channelId: joinedVoiceChannel });
      setJoinedVoiceChannel(null);
    }
  };

  // ── Fetch user's servers ──
  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/servers/mine`, { headers: authHeaders(token) });
      if (res.ok) {
        const data = await res.json();
        setServers(data);
      }
    } catch (err) {
      console.error("Failed to fetch servers:", err);
    }
  }, [token]);

  useEffect(() => { fetchServers(); }, [fetchServers]);

  // ── Close user popup on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (userPopupRef.current && !userPopupRef.current.contains(e.target)) {
        setShowUserPopup(false);
        setShowStatusSubmenu(false);
      }
    };
    if (showUserPopup) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserPopup]);

  // ── Fetch full server data when active server changes ──
  const fetchServerData = useCallback(async () => {
    if (activeServer === "home" || !activeServer) return;
    try {
      const res = await fetch(`${API}/servers/${activeServer}`, { headers: authHeaders(token) });
      if (res.ok) {
        const data = await res.json();
        setServerData(data);
        if (data.channels.length > 0) {
          setActiveChannel((prev) => {
            const exists = data.channels.find((c) => c.id === prev);
            return exists ? prev : data.channels[0].id;
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch server:", err);
    }
  }, [activeServer, token]);

  useEffect(() => {
    if (activeServer !== "home" && activeServer) {
      fetchServerData();
    } else {
      setServerData(null);
      setActiveChannel(null);
      setMessages([]);
      setShowServerMenu(false);
    }
  }, [activeServer, fetchServerData]);




  // ── Fetch messages for active channel + poll every 3s ──
  const fetchMessages = useCallback(async () => {
    if (activeServer === "home" || !activeServer || !activeChannel) return;

    try {
      const res = await fetch(
        `${API}/servers/${activeServer}/channels/${activeChannel}/messages`,
        { headers: authHeaders(token) }
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, [activeServer, activeChannel, token]);

  useEffect(() => {
    fetchMessages();

    if (socket && activeChannel && activeServer !== "home") {
      socket.emit("join_channel", activeChannel);

      const handleNewMessage = (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      };

      socket.on("new_message", handleNewMessage);

      return () => {
        socket.off("new_message", handleNewMessage);
        socket.emit("leave_channel", activeChannel);
      };
    }
  }, [fetchMessages, socket, activeChannel, activeServer]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──
  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!msgInput.trim() && !attachmentFile) || !activeChannel || isSending) return;

    try {
      setIsSending(true);
      let finalAttachmentUrl = null;

      // If there's an attachment, upload it first
      if (attachmentFile) {
        const formData = new FormData();
        formData.append("image", attachmentFile);

        const uploadRes = await fetch(`${API}/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
            // Do NOT set Content-Type; FormData sets it with boundary
          },
          body: formData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          alert(`Attachment upload failed: ${errData.error}`);
          setIsSending(false);
          return; // Abort sending
        }

        const uploadData = await uploadRes.json();
        finalAttachmentUrl = uploadData.url;
      }

      await fetch(
        `${API}/servers/${activeServer}/channels/${activeChannel}/messages`,
        {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            content: msgInput,
            attachmentUrl: finalAttachmentUrl
          }),
        }
      );
      setMsgInput("");
      cancelAttachment();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // ── Voice/Video Call Functions ──
  const logCallStartEvent = async (type) => {
    if (!activeServer || activeServer === "home" || !activeChannel) return;
    try {
      await fetch(
        `${API}/servers/${activeServer}/channels/${activeChannel}/call-events`,
        {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ callType: type }),
        }
      );
    } catch (err) {
      console.error("Failed to log call start event:", err);
    }
  };

  const startCall = async (targetMember, type) => {
    if (!targetMember?.socketId) {
      alert('User is not online');
      return;
    }
    if (targetMember.id === userId) {
      alert('Cannot call yourself');
      return;
    }
    
    // EXCLUSIVITY: Disconnect voice channel if starting private call
    if (joinedVoiceChannel) {
      handleDisconnectVoice();
    }

    await logCallStartEvent(type);
    setTargetUser(targetMember);
    setCallType(type);
    setIncomingCall(null);
    setIsCallModalOpen(true);
  };

  const handleCallClose = () => {
    // CallModal handles signaling (end-call emit) internally.
    // AppPage just resets its own state.
    setIsCallModalOpen(false);
    setTargetUser(null);
    setIncomingCall(null);
  };


  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachmentFile(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
    // reset input so the same file over and over triggers change
    e.target.value = null;
  };

  const cancelAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  // ── Logout ──
  const handleLogout = () => {
    auth.logout();
    navigate("/");
  };

  // ── Server created callback ──
  const onServerCreated = () => {
    setIsServerModalOpen(false);
    fetchServers();
  };

  // ── Delete server (owner only) ──
  const handleDeleteServer = async () => {
    if (!serverData || serverData.ownerId !== userId) return;
    if (!window.confirm(`Delete "${serverData.name}"? This cannot be undone.`)) return;

    try {
      await fetch(`${API}/servers/${activeServer}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      setActiveServer("home");
      setShowServerMenu(false);
      fetchServers();
    } catch (err) {
      console.error("Failed to delete server:", err);
    }
  };

  // ── Leave server ──
  const handleLeaveServer = async () => {
    if (!window.confirm(`Leave "${serverData?.name}"?`)) return;

    try {
      await fetch(`${API}/servers/${activeServer}/leave`, {
        method: "POST",
        headers: authHeaders(token),
      });
      setActiveServer("home");
      setShowServerMenu(false);
      fetchServers();
    } catch (err) {
      console.error("Failed to leave server:", err);
    }
  };

  // ── Copy invite link ──
  const handleCopyInvite = () => {
    const code = serverData?.inviteCode;
    if (!code) return;
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link);
    setToast("Invite link copied!");
    setShowServerMenu(false);
    setTimeout(() => setToast(""), 2500);
  };

  // ── Server joined callback ──
  const onServerJoined = () => {
    fetchServers();
  };

  const channels = serverData?.channels || [];
  const members = serverData?.membersData || [];
  const currentServer = servers.find((s) => s.id === activeServer);
  const activeChannelObj = channels.find((c) => c.id === activeChannel);
  const activeChannelName = activeChannelObj?.name || "";

  // ── User Info Bar ──
  const UserInfoBar = () => (
    <footer className={styles.userInfo} style={{ position: 'relative' }}>
      {/* User Profile Popup */}
      {showUserPopup && (
        <div ref={userPopupRef} className={styles.userPopup}>
          {/* Banner + Avatar */}
          <div className={styles.userPopupBanner}>
            <div className={styles.userPopupAvatar} style={auth.user?.avatarUrl ? { backgroundImage: `url(${auth.user.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}>
              {!auth.user?.avatarUrl && username.charAt(0).toUpperCase()}
              <div className={styles.userPopupStatusDot}></div>
            </div>
          </div>
          {/* Name */}
          <div className={styles.userPopupNames}>
            <div className={styles.userPopupDisplayName}>{username}</div>
            <div className={styles.userPopupUsername}>{username.toLowerCase().replace(/\s/g, '_')}</div>
          </div>
          {/* Actions */}
          <div className={styles.userPopupActions}>
            <button
              className={styles.userPopupItem}
              onClick={() => { setShowUserPopup(false); setShowSettings(true); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Edit Profile
            </button>

            <div style={{ position: 'relative' }}>
              <button
                className={styles.userPopupItem}
                onClick={() => setShowStatusSubmenu(!showStatusSubmenu)}
              >
                <span
                  className={styles.statusDotBase}
                  style={{ background: STATUSES[currentStatus].dot }}
                ></span>
                {STATUSES[currentStatus].label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: showStatusSubmenu ? 'rotate(90deg)' : 'none' }}><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              {showStatusSubmenu && (
                <div className={styles.statusInlinePanel}>
                  <button className={`${styles.statusPanelItem} ${currentStatus === 'online' ? styles.statusPanelActive : ''}`} onClick={() => selectStatus('online')}>
                    <span className={styles.statusDotBase} style={{ background: '#22c55e' }}></span>
                    Online
                  </button>
                  <button className={`${styles.statusPanelItem} ${currentStatus === 'idle' ? styles.statusPanelActive : ''}`} onClick={() => selectStatus('idle')}>
                    <span className={styles.statusDotBase} style={{ background: '#f59e0b' }}></span>
                    <div className={styles.statusPanelText}><span>Idle</span></div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                  <button className={`${styles.statusPanelItem} ${currentStatus === 'dnd' ? styles.statusPanelActive : ''}`} onClick={() => selectStatus('dnd')}>
                    <span className={styles.statusDotBase} style={{ background: '#ef4444' }}></span>
                    <div className={styles.statusPanelText}>
                      <span>Do Not Disturb</span>
                      <span className={styles.statusPanelDesc}>You will not receive desktop notifications</span>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                  <button className={`${styles.statusPanelItem} ${currentStatus === 'invisible' ? styles.statusPanelActive : ''}`} onClick={() => selectStatus('invisible')}>
                    <span className={styles.statusDotBase} style={{ background: '#6b7280' }}></span>
                    <div className={styles.statusPanelText}>
                      <span>Invisible</span>
                      <span className={styles.statusPanelDesc}>You will appear offline</span>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </div>

            <button
              className={`${styles.userPopupItem} ${styles.userPopupItemMuted}`}
              onClick={() => { setShowUserPopup(false); handleLogout(); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 10H3M7 6l-4 4 4 4" /><path d="M21 21V15M21 9V3M3 3v18" /></svg>
              Switch Accounts
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      )}

      <div
        className={styles.userLeft}
        onClick={() => { setShowUserPopup(!showUserPopup); setShowStatusSubmenu(false); }}
      >
        <div className={styles.avatarWrapper}>
          <div className={styles.userAvatar} style={auth.user?.avatarUrl ? { backgroundImage: `url(${auth.user.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}>
            {!auth.user?.avatarUrl && username.charAt(0).toUpperCase()}
          </div>
          <div className={styles.statusIndicator} style={{ background: STATUSES[currentStatus].indicatorColor }}></div>
        </div>
        <div className={styles.userText}>
          <div className={styles.userName}>{username}</div>
          <div className={styles.userStatus}>
            {isCallModalOpen ? (
              <span style={{ color: '#23a559', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                In voice
              </span>
            ) : (
              STATUSES[currentStatus].label
            )}
          </div>
        </div>
      </div>

      <div className={styles.userControls}>
        <button 
          type="button" 
          className={`${styles.userIconBtn} ${isMuted ? styles.userIconBtnDanger : ''}`} 
          title={isMuted ? "Unmute" : "Mute"} 
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
          )}
        </button>
        <button 
          type="button" 
          className={`${styles.userIconBtn} ${isDeafened ? styles.userIconBtnDanger : ''}`} 
          title={isDeafened ? "Undeafen" : "Deafen"} 
          onClick={() => setIsDeafened(!isDeafened)}
        >
          {isDeafened ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.9 13.5a10.02 10.02 0 0 0-2.43-8.83M5.1 10.5A10 10 0 0 0 12 22"></path><path d="M9 18a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3"></path><path d="M15 12a3 3 0 0 1 3 3v2.85"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
          )}
        </button>
        <button type="button" className={styles.userIconBtn} title="User Settings" onClick={() => setShowSettings(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M19.738 10H22V14H19.739C19.498 14.931 19.1 15.798 18.565 16.564L20.166 18.166L17.336 20.995L15.736 19.396C14.998 19.901 14.167 20.279 13.279 20.505V23H9.279V20.505C8.391 20.28 7.559 19.901 6.822 19.396L5.222 20.995L2.392 18.166L3.993 16.564C3.458 15.798 3.06 14.931 2.819 14H0.5V10H2.819C3.06 9.069 3.458 8.202 3.993 7.436L2.392 5.834L5.222 3.005L6.822 4.604C7.559 4.099 8.391 3.721 9.279 3.495V1H13.279V3.495C14.167 3.72 14.998 4.099 15.736 4.604L17.336 3.005L20.166 5.834L18.565 7.436C19.1 8.202 19.498 9.069 19.738 10ZM11.279 16C13.488 16 15.279 14.209 15.279 12C15.279 9.791 13.488 8 11.279 8C9.07 8 7.279 9.791 7.279 12C7.279 14.209 9.07 16 11.279 16Z" />
          </svg>
        </button>
      </div>
    </footer>
  );

  return (
    <div className={styles.layout}>
      {/* 1. SERVER BAR */}
      <aside className={styles.serverSidebar}>
        <button
          type="button"
          className={`${styles.serverHome} ${activeServer === "home" ? styles.activeHome : ""}`}
          title="Direct Messages"
          onClick={() => setActiveServer("home")}
        >
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="8" y="50" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="46" fill="currentColor">ls</text>
            <circle cx="52" cy="48" r="5" fill="#ef4444" />
          </svg>
        </button>

        <div className={styles.divider} />

        {/* --- DYNAMIC SERVER ICONS --- */}
        {servers.map((server) => (
          <button
            key={server.id}
            type="button"
            title={server.name}
            className={`${styles.serverIcon} ${activeServer === server.id ? styles.activeServer : ""}`}
            style={{
              backgroundColor: server.color || "#5865f2",
              backgroundImage: server.iconUrl ? `url(${server.iconUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: server.iconUrl ? 'transparent' : 'inherit'
            }}
            onClick={() => setActiveServer(server.id)}
          >
            {!server.iconUrl && server.name.charAt(0).toUpperCase()}
          </button>
        ))}

        <button
          type="button"
          title="Add a Server"
          className={styles.serverIcon}
          style={{ background: "transparent", border: "1px dashed #35363c" }}
          onClick={() => setIsServerModalOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
        </button>
      </aside>

      {/* 2. SECONDARY SIDEBAR */}
      <aside className={styles.secondarySidebar}>
        {activeServer === "home" ? (
          <>
            <div className={styles.searchWrapper}>
              <button className={styles.searchButton}>Find or start a conversation</button>
            </div>
            <div className={styles.scrollSection}>
              <div className={styles.dmNavList}>
                <div className={`${styles.navItem} ${styles.activeNavItem}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" /></svg>
                  <span>Friends</span>
                </div>
                <div className={styles.navItem}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                  <span>Nitro</span>
                </div>
              </div>
              <div className={styles.dmSectionHeader}>
                <span>Direct Messages</span>
                <button className={styles.addDmBtn}>+</button>
              </div>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={styles.dmPlaceholder}>
                  <div className={styles.dmAvatarGhost}></div>
                  <div className={styles.dmNameGhost}></div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <header className={styles.serverHeader} onClick={() => setShowServerMenu(!showServerMenu)}>
              <span>{currentServer?.name || serverData?.name || "Server"}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showServerMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </header>

            {/* Server dropdown menu */}
            {showServerMenu && (
              <div className={styles.serverDropdown}>
                <button className={styles.dropdownItem} onClick={handleCopyInvite}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                  Invite People
                </button>
                {serverData?.ownerId === userId && (
                  <button className={styles.dropdownItem} onClick={() => { setIsEditServerModalOpen(true); setShowServerMenu(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Server Settings
                  </button>
                )}
                {serverData?.ownerId !== userId && (
                  <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={handleLeaveServer}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Leave Server
                  </button>
                )}
                {serverData?.ownerId === userId && (
                  <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={handleDeleteServer}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete Server
                  </button>
                )}
              </div>
            )}

            <section className={styles.scrollSection}>
              <div className={styles.categoryHeader}>
                <span>Text Channels</span>
                {/* NEW: Add Channel Button - only for server owner */}
                {serverData?.ownerId === userId && (
                  <button
                    className={styles.addChannelBtn}
                    onClick={() => { setIsChannelModalOpen(true); setNewChannelType("text"); }}
                    title="Create Text Channel"
                  >
                    +
                  </button>
                )}
              </div>
              {channels.filter(ch => ch.type === "text" || !ch.type).map((ch) => (
                <button
                  key={ch.id}
                  className={`${styles.channel} ${activeChannel === ch.id ? styles.activeChannel : ""}`}
                  onClick={() => setActiveChannel(ch.id)}
                >
                  <div className={styles.channelLeft}>
                    <span className={styles.hash}>#</span>
                    {ch.name}
                  </div>
                  {/* NEW: Delete Channel Button - only for server owner */}
                  {serverData?.ownerId === userId && (
                    <div className={styles.channelRight}>
                      <svg
                        onClick={(e) => handleDeleteChannel(e, ch.id)}
                        className={styles.channelDeleteIcon}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </div>
                  )}
                </button>
              ))}

              <div className={styles.categoryHeader} style={{ marginTop: '16px' }}>
                <span>Voice Channels</span>
                {/* NEW: Add Channel Button - only for server owner */}
                {serverData?.ownerId === userId && (
                  <button
                    className={styles.addChannelBtn}
                    onClick={() => { setIsChannelModalOpen(true); setNewChannelType("voice"); }}
                    title="Create Voice Channel"
                  >
                    +
                  </button>
                )}
              </div>
              {channels.filter(ch => ch.type === "voice").map((ch) => (
                <div key={ch.id}>
                  <button
                    className={`${styles.channel} ${activeChannel === ch.id ? styles.activeChannel : ""}`}
                    onClick={() => setActiveChannel(ch.id)}
                  >
                  <div className={styles.channelLeft}>
                    <span className={styles.hash}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    </span>
                    {ch.name}
                  </div>
                  <div className={styles.channelRight}>
                    {/* Open Chat (Speech Bubble) */}
                    <svg
                      onClick={(e) => { e.stopPropagation(); setActiveChannel(ch.id); }}
                      className={styles.channelActionIcon}
                      width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
                      title="Open Chat"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>

                    {/* Create Invite (Person +) */}
                    <svg
                      onClick={(e) => { e.stopPropagation(); handleCopyInvite(); }}
                      className={styles.channelActionIcon}
                      width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
                      title="Create Invite"
                    >
                      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>

                    {/* Delete Channel - Only for Owner */}
                    {serverData?.ownerId === userId && (
                      <svg
                        onClick={(e) => handleDeleteChannel(e, ch.id)}
                        className={styles.channelDeleteIcon}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        title="Delete Channel"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    )}
                  </div>
                </button>
                {/* Voice Users List */}
                {(voiceUsers[ch.id] || []).map((u, i) => (
                  <div key={`vu-${u.id || i}`} className={styles.voiceUserRow}>
                    <div className={styles.voiceUserAvatar} style={{
                       border: speakingUsers[u.socketId] ? '2px solid #57f287' : 'none',
                       backgroundImage: u.avatarUrl ? `url(${u.avatarUrl})` : 'none',
                       backgroundSize: 'cover',
                       backgroundPosition: 'center',
                       color: u.avatarUrl ? 'transparent' : 'inherit' 
                    }}>
                      {!u.avatarUrl && (u.username?.charAt(0).toUpperCase() || '?')}
                    </div>
                    <span className={styles.voiceUserName}>{u.username || 'User'}</span>
                  </div>
                ))}
              </div>
              ))}

            </section>
          </>
        )}
        {/* Voice Connected Panel (when joined) */}
        {joinedVoiceChannel && (
          <div className={callStyles.voiceConnectedPanel} style={{ position: 'static', width: '100%', borderRadius: 0, borderBottom: '1px solid var(--bg-deep)' }}>
            <div className={callStyles.voiceConnectedHeader}>
              <div className={callStyles.voiceConnectedHeaderLeft} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={callStyles.voiceConnectedSignalBox}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M11 2.008C11 1.452 11.448 1 12 1c5.523 0 10 4.477 10 10s-4.477 10-10 10c-.552 0-1-.448-1-1v-1.008a8.001 8.001 0 0 1-7-7.992V11c0-.552.448-1 1-1h1.008a6.001 6.001 0 0 0 5.992 5.992V17c0 .552.448 1 1 1a4 4 0 0 0 4-4c0-.552-.448-1-1-1h-1.008a2.001 2.001 0 0 1-1.992-1.992V11c0-.552.448-1 1-1A4 4 0 0 0 11 14v1.008zM12 4a6 6 0 0 1 6 6h-2a4 4 0 0 0-4-4V4zM4.27 3.518A9.965 9.965 0 0 0 2 11v2a9.965 9.965 0 0 0 2.27 6.482l1.414-1.414A7.971 7.971 0 0 1 4 13v-2c0-1.84.62-3.535 1.684-4.896L4.27 3.518z" />
                  </svg>
                </div>
                <div className={callStyles.voiceConnectedText}>
                  <div className={callStyles.voiceConnectedStatus}>Voice Connected</div>
                  <div className={callStyles.voiceConnectedChannel}>
                    {serverData?.name || 'Server'} / {channels.find(c => c.id === joinedVoiceChannel)?.name}
                  </div>
                </div>
              </div>
              <div className={callStyles.voiceConnectedHeaderRight}>
                <button className={callStyles.disconnectBtn} onClick={handleDisconnectVoice} title="Disconnect">
                  <PhoneOff size={20} />
                </button>
              </div>
            </div>
            <div className={callStyles.voiceConnectedActions}>
              <button className={`${callStyles.panelBtn} ${isMuted ? callStyles.active : ''}`} onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute" : "Mute"}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button className={`${callStyles.panelBtn} ${isDeafened ? callStyles.active : ''}`} onClick={() => setIsDeafened(!isDeafened)} title={isDeafened ? "Undeafen" : "Deafen"}>
                {isDeafened ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.9 13.5a10.02 10.02 0 0 0-2.43-8.83M5.1 10.5A10 10 0 0 0 12 22"></path><path d="M9 18a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3"></path><path d="M15 12a3 3 0 0 1 3 3v2.85"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                )}
              </button>
            </div>
          </div>
        )}
        <div id="voice-controls-portal"></div>
        <UserInfoBar />
      </aside>

      {/* 3. MAIN AREA — INTEGRATED REF AND GLOW LAYER */}
      <main
        className={styles.mainArea}
        ref={mainAreaRef}
        onMouseMove={handleMouseMove}
      >
        <div className={styles.dynamicGlow}></div> {/* Dynamic Background Layer */}
        <div id="main-video-portal"></div>

        {activeServer === "home" ? (
          <>
            <header className={styles.topHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.headerTitle}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" /></svg>
                  Friends
                </div>
                <div className={styles.headerDivider}></div>
                <div className={styles.headerTabs}>
                  <button className={`${styles.tabBtn} ${activeHomeTab === 'online' ? styles.activeTabBtn : ''}`} onClick={() => setActiveHomeTab('online')}>Online</button>
                  <button className={`${styles.tabBtn} ${activeHomeTab === 'all' ? styles.activeTabBtn : ''}`} onClick={() => setActiveHomeTab('all')}>All</button>
                  <button className={`${styles.tabBtn} ${activeHomeTab === 'pending' ? styles.activeTabBtn : ''}`} onClick={() => setActiveHomeTab('pending')}>Pending{friendsData.incoming.length > 0 && <span className={styles.pendingBadge}>{friendsData.incoming.length}</span>}</button>
                  <button className={`${styles.tabBtn} ${activeHomeTab === 'addFriend' ? styles.activeTabBtn : ''}`} onClick={() => { setActiveHomeTab('addFriend'); setFriendRequestMsg(''); }}>Add Friend</button>
                </div>
              </div>
            </header>
            <div className={styles.friendsLayout}>
              <div className={styles.friendsMain}>
                {/* ── Add Friend Tab ── */}
                {activeHomeTab === 'addFriend' && (
                  <>
                    <div className={styles.addFriendSection}>
                      <div className={styles.addFriendHeader}>
                        <div>
                          <h2 className={styles.addFriendTitle}>Add Friend</h2>
                          <p className={styles.addFriendDesc}>You can add friends with their LinkSphere username.</p>
                        </div>
                      </div>
                      <div className={styles.addFriendInputBox}>
                        <input
                          type="text"
                          className={styles.friendInput}
                          placeholder="Enter a username"
                          value={friendInput}
                          onChange={(e) => setFriendInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendFriendRequest()}
                        />
                        <button
                          className={`${styles.sendRequestBtn} ${friendInput ? styles.active : ""}`}
                          onClick={handleSendFriendRequest}
                          disabled={!friendInput.trim()}
                        >
                          Send Friend Request
                        </button>
                      </div>
                      {friendRequestMsg && (
                        <div className={`${styles.friendFeedback} ${friendRequestStatus === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}>
                          {friendRequestMsg}
                        </div>
                      )}
                    </div>
                    <div className={styles.otherPlaces}>
                      <h2 className={styles.addFriendTitle}>Your Servers</h2>
                      <p className={styles.addFriendDesc}>You are a member of {servers.length} server{servers.length !== 1 ? "s" : ""}.</p>
                    </div>
                  </>
                )}

                {/* ── All Friends Tab ── */}
                {activeHomeTab === 'all' && (
                  <div className={styles.friendListSection}>
                    <div className={styles.friendListHeader}>All Friends — {friendsData.friends.length}</div>
                    {friendsData.friends.length === 0 ? (
                      <div className={styles.emptyFriendsMsg}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{opacity:0.3}}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                        <p>You don't have any friends yet. Send a friend request to get started!</p>
                      </div>
                    ) : (
                      friendsData.friends.map(f => (
                        <div key={f.id} className={styles.friendRow}>
                          <div className={styles.friendRowLeft}>
                            <div className={styles.friendAvatarWrap}>
                              <div className={styles.friendAvatar} style={{ backgroundImage: f.avatarUrl ? `url(${f.avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', color: f.avatarUrl ? 'transparent' : 'inherit' }}>
                                {!f.avatarUrl && f.username.charAt(0).toUpperCase()}
                              </div>
                              <div className={styles.friendDot} style={{ background: onlineUsers[f.id] ? '#23a559' : '#80848e' }}></div>
                            </div>
                            <div className={styles.friendInfo}>
                              <span className={styles.friendName}>{f.username}</span>
                              <span className={styles.friendStatusText}>{onlineUsers[f.id] ? 'Online' : 'Offline'}</span>
                            </div>
                          </div>
                          <div className={styles.friendRowActions}>
                            <button className={styles.friendActionBtn} title="Message"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></button>
                            <button className={`${styles.friendActionBtn} ${styles.friendActionDanger}`} title="Remove Friend" onClick={() => handleRemoveFriend(f.id)}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── Online Friends Tab ── */}
                {activeHomeTab === 'online' && (
                  <div className={styles.friendListSection}>
                    <div className={styles.friendListHeader}>Online — {friendsData.friends.filter(f => onlineUsers[f.id]).length}</div>
                    {friendsData.friends.filter(f => onlineUsers[f.id]).length === 0 ? (
                      <div className={styles.emptyFriendsMsg}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{opacity:0.3}}><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                        <p>None of your friends are online right now.</p>
                      </div>
                    ) : (
                      friendsData.friends.filter(f => onlineUsers[f.id]).map(f => (
                        <div key={f.id} className={styles.friendRow}>
                          <div className={styles.friendRowLeft}>
                            <div className={styles.friendAvatarWrap}>
                              <div className={styles.friendAvatar} style={{ backgroundImage: f.avatarUrl ? `url(${f.avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', color: f.avatarUrl ? 'transparent' : 'inherit' }}>
                                {!f.avatarUrl && f.username.charAt(0).toUpperCase()}
                              </div>
                              <div className={styles.friendDot} style={{ background: '#23a559' }}></div>
                            </div>
                            <div className={styles.friendInfo}>
                              <span className={styles.friendName}>{f.username}</span>
                              <span className={styles.friendStatusText}>Online</span>
                            </div>
                          </div>
                          <div className={styles.friendRowActions}>
                            <button className={styles.friendActionBtn} title="Message"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></button>
                            <button className={`${styles.friendActionBtn} ${styles.friendActionDanger}`} title="Remove Friend" onClick={() => handleRemoveFriend(f.id)}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── Pending Tab ── */}
                {activeHomeTab === 'pending' && (
                  <div className={styles.friendListSection}>
                    <div className={styles.friendListHeader}>Pending — {friendsData.incoming.length + friendsData.outgoing.length}</div>
                    {friendsData.incoming.length === 0 && friendsData.outgoing.length === 0 ? (
                      <div className={styles.emptyFriendsMsg}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{opacity:0.3}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        <p>No pending friend requests.</p>
                      </div>
                    ) : (
                      <>
                        {friendsData.incoming.map(f => (
                          <div key={`in-${f.id}`} className={styles.friendRow}>
                            <div className={styles.friendRowLeft}>
                              <div className={styles.friendAvatarWrap}>
                                <div className={styles.friendAvatar} style={{ backgroundImage: f.avatarUrl ? `url(${f.avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', color: f.avatarUrl ? 'transparent' : 'inherit' }}>
                                  {!f.avatarUrl && f.username.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className={styles.friendInfo}>
                                <span className={styles.friendName}>{f.username}</span>
                                <span className={styles.friendStatusText}>Incoming Friend Request</span>
                              </div>
                            </div>
                            <div className={styles.friendRowActions}>
                              <button className={`${styles.friendActionBtn} ${styles.friendActionAccept}`} title="Accept" onClick={() => handleAcceptFriend(f.id)}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></button>
                              <button className={`${styles.friendActionBtn} ${styles.friendActionDanger}`} title="Decline" onClick={() => handleDeclineFriend(f.id)}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
                            </div>
                          </div>
                        ))}
                        {friendsData.outgoing.map(f => (
                          <div key={`out-${f.id}`} className={styles.friendRow}>
                            <div className={styles.friendRowLeft}>
                              <div className={styles.friendAvatarWrap}>
                                <div className={styles.friendAvatar} style={{ backgroundImage: f.avatarUrl ? `url(${f.avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', color: f.avatarUrl ? 'transparent' : 'inherit' }}>
                                  {!f.avatarUrl && f.username.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className={styles.friendInfo}>
                                <span className={styles.friendName}>{f.username}</span>
                                <span className={styles.friendStatusText}>Outgoing Friend Request</span>
                              </div>
                            </div>
                            <div className={styles.friendRowActions}>
                              <button className={`${styles.friendActionBtn} ${styles.friendActionDanger}`} title="Cancel" onClick={() => handleCancelFriend(f.id)}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ── Active Now Sidebar ── */}
              <aside className={styles.activeNow}>
                <h3 className={styles.activeNowTitle}>Active Now</h3>
                {friendsData.friends.filter(f => onlineUsers[f.id]).length === 0 ? (
                  <div className={styles.emptyActiveCard}>
                    <h4 className={styles.emptyActiveTitle}>It's quiet for now...</h4>
                    <p className={styles.emptyActiveText}>When a friend starts an activity—like playing a game or hanging out on voice—we'll show it here!</p>
                  </div>
                ) : (
                  <div className={styles.activeNowList}>
                    {friendsData.friends.filter(f => onlineUsers[f.id]).map(f => (
                      <div key={f.id} className={styles.activeNowItem}>
                        <div className={styles.friendAvatarWrap}>
                          <div className={styles.friendAvatar} style={{ backgroundImage: f.avatarUrl ? `url(${f.avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', color: f.avatarUrl ? 'transparent' : 'inherit' }}>
                            {!f.avatarUrl && f.username.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.friendDot} style={{ background: '#23a559' }}></div>
                        </div>
                        <span className={styles.activeNowName}>{f.username}</span>
                      </div>
                    ))}
                  </div>
                )}
              </aside>
            </div>
          </>
        ) : (
          <>
            <header className={styles.topHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.hash} style={{ marginRight: 8 }}>
                  {activeChannelObj?.type === 'voice' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  ) : '#'}
                </span>
                <span className={styles.headerTitle}>{activeChannelName}</span>
              </div>
              <div className={styles.headerRight}>
                <span className={styles.memberCount}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" /></svg>
                  {members.length}
                </span>
              </div>
            </header>

            {activeChannelObj?.type === "voice" ? (
              joinedVoiceChannel === activeChannel ? (
                <div className={callStyles.mainVideoPortal} style={{ position: 'relative', height: '100%' }}>
                  <div className={callStyles.callGrid}>
                    {/* Local Tile */}
                    <div className={`${callStyles.gridTile} ${speakingUsers[socket?.id] ? callStyles.isSpeakingVideo : ''}`}>
                      {isVideoOn || isScreenSharing ? (
                        <video
                          ref={el => { if (el && el.srcObject !== localStream) el.srcObject = localStream; }}
                          autoPlay
                          playsInline
                          muted
                          className={callStyles.remoteVideo}
                          style={isScreenSharing ? { objectFit: 'contain' } : { transform: 'scaleX(-1)' }}
                        />
                      ) : (
                        <div className={`${callStyles.tileAvatar} ${speakingUsers[socket?.id] ? callStyles.isSpeaking : ''}`} style={user?.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}>
                          {!user?.avatarUrl && (user?.username?.charAt(0).toUpperCase() || '?')}
                        </div>
                      )}
                      {!isVideoOn && !isScreenSharing && (
                        <div className={callStyles.waitingOverlayAudio}>
                          <span>Voice Connected</span>
                        </div>
                      )}
                      <div className={callStyles.tileName} style={{ display: 'flex', alignItems: 'center' }}>
                        {user?.username || 'You'} (You)
                        {isMuted && <MicOff size={14} style={{ marginLeft: 6, color: '#f23f43' }} />}
                      </div>
                    </div>
                    {/* Remote Tiles */}
                    {(voiceUsers[activeChannel] || []).filter(u => u.id !== userId).map(u => {
                      const remoteStream = remoteStreams[u.socketId];
                      const activeVideoTracks = remoteStream ? remoteStream.getVideoTracks().filter(t => t.readyState === 'live' && !t.muted) : [];
                      const hasVideo = activeVideoTracks.length > 0;
                      return (
                        <div key={u.id} className={`${callStyles.gridTile} ${speakingUsers[u.socketId] ? callStyles.isSpeakingVideo : ''}`}>
                          {hasVideo ? (
                            <video
                              ref={el => { if (el && el.srcObject !== remoteStream) el.srcObject = remoteStream; }}
                              autoPlay
                              playsInline
                              muted
                              className={callStyles.remoteVideo}
                            />
                          ) : (
                            <div className={`${callStyles.tileAvatar} ${speakingUsers[u.socketId] ? callStyles.isSpeaking : ''}`} style={u.avatarUrl ? { backgroundImage: `url(${u.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}>
                              {!u.avatarUrl && (u.username?.charAt(0).toUpperCase() || '?')}
                            </div>
                          )}
                          <div className={callStyles.tileName} style={{ display: 'flex', alignItems: 'center' }}>
                            {u.username}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className={callStyles.bottomControls}>
                    <div className={callStyles.controlGroup}>
                      <button className={`${callStyles.controlBtn} ${isMuted ? callStyles.danger : ''}`} onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute" : "Mute"}>
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                      <button className={`${callStyles.controlBtn} ${!isVideoOn ? callStyles.danger : ''}`} onClick={toggleVideo} title="Camera">
                        {!isVideoOn ? <VideoOff size={20} /> : <Video size={20} />}
                      </button>
                    </div>

                    <div className={callStyles.controlGroup}>
                      <button className={`${callStyles.controlBtn} ${isScreenSharing ? callStyles.active : ''}`} onClick={toggleScreenShare} title="Share Your Screen">
                        {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                      </button>
                      <button className={`${callStyles.controlBtn} ${isDeafened ? callStyles.danger : ''}`} onClick={() => setIsDeafened(!isDeafened)} title={isDeafened ? "Undeafen" : "Deafen"}>
                        {isDeafened ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.9 13.5a10.02 10.02 0 0 0-2.43-8.83M5.1 10.5A10 10 0 0 0 12 22"></path><path d="M9 18a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3"></path><path d="M15 12a3 3 0 0 1 3 3v2.85"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                        )}
                      </button>
                    </div>

                    <button className={`${callStyles.controlBtn} ${callStyles.endCallBtnBig}`} onClick={handleDisconnectVoice} title="Disconnect">
                      <PhoneOff size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.voiceChannelMainUI}>
                  <div className={styles.starsOverlay}></div>
                  <div className={styles.voiceChannelCenter}>
                    <div className={styles.voiceChannelAvatars}>
                      {(voiceUsers[activeChannel] || []).length > 0 && (
                        (voiceUsers[activeChannel] || []).map((u, i) => (
                          <div key={u.id || i} className={styles.voiceChannelAvatarLarge} style={u.avatarUrl ? { backgroundImage: `url(${u.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}>
                            {!u.avatarUrl && (u.username?.charAt(0).toUpperCase() || '?')}
                          </div>
                        ))
                      )}
                    </div>
                    <h2 className={styles.voiceChannelName}>{activeChannelName}</h2>
                    {(voiceUsers[activeChannel] || []).length > 0 ? (
                      <p className={styles.voiceChannelSubtitle}>
                        <strong style={{ color: 'var(--text-primary)' }}>{(voiceUsers[activeChannel] || []).map(u => u.username).join(", ")}</strong> {(voiceUsers[activeChannel] || []).length === 1 ? 'is' : 'are'} currently in voice
                      </p>
                    ) : (
                      <p className={styles.voiceChannelSubtitle}>No one is currently in voice</p>
                    )}
                    <button className={styles.joinVoiceBtn} onClick={() => handleJoinVoiceChannel(activeChannel)}>Join Voice</button>
                  </div>
                </div>
              )
            ) : (
            <div className={styles.chatLayout}>
              {/* Messages area */}
              <div className={styles.chatArea}>
                <div className={styles.messageList}>
                  {messages.length === 0 && (
                    <div className={styles.welcomeMsg}>
                      <div className={styles.welcomeHash}>#</div>
                      <h2 className={styles.welcomeTitle}>Welcome to #{activeChannelName}!</h2>
                      <p className={styles.welcomeDesc}>This is the start of the #{activeChannelName} channel.</p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    msg.type === "system" && msg.systemKind === "call_started" ? (
                      <div key={msg.id} className={styles.callSystemMsg}>
                        <div className={styles.callSystemIcon}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16.42v3.54a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 1.14 4.18 2 2 0 0 1 3.13 2h3.54a2 2 0 0 1 2 1.72c.12.89.35 1.76.68 2.59a2 2 0 0 1-.45 2.11L7.42 9.9a16 16 0 0 0 6.68 6.68l1.48-1.48a2 2 0 0 1 2.11-.45c.83.33 1.7.56 2.59.68A2 2 0 0 1 21 16.42z" /></svg>
                        </div>
                        <span className={styles.callSystemText}>{msg.content}</span>
                        <span className={styles.msgTimestamp}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ) : msg.type === "system" ? (
                      <div key={msg.id} className={styles.systemMsg}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13 12H3" /></svg>
                        <span>{msg.content}</span>
                        <span className={styles.msgTimestamp}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ) : (
                      <div key={msg.id} className={styles.message}>
                        <div className={styles.msgAvatarCircle} style={{
                          background: msg.authorId === userId ? '#5865f2' : '#23a559',
                          backgroundImage: msg.authorAvatarUrl ? `url(${msg.authorAvatarUrl})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          color: msg.authorAvatarUrl ? 'transparent' : 'inherit'
                        }}>
                          {!msg.authorAvatarUrl && ((msg.authorId === userId ? username : msg.authorName)?.charAt(0).toUpperCase() || "?")}
                        </div>
                        <div className={styles.msgContent}>
                          <div className={styles.msgHeader}>
                            <span className={styles.msgAuthor} style={{
                              color: msg.authorId === userId ? '#949cf7' : '#57f287'
                            }}>
                              {msg.authorId === userId ? username : msg.authorName}
                            </span>
                            <span className={styles.msgTimestamp}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {msg.content && <p className={styles.msgBody}>{msg.content}</p>}
                          {msg.attachmentUrl && (
                            <div className={styles.msgAttachmentWrap}>
                              <img src={msg.attachmentUrl} alt="attachment" className={styles.msgAttachment} />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Message input */}
                <div className={styles.chatInputContainer}>
                  {attachmentPreview && (
                    <div className={styles.attachmentPreviewWrap}>
                      <img src={attachmentPreview} alt="preview" className={styles.attachmentPreviewImg} />
                      <button type="button" className={styles.cancelAttachmentBtn} onClick={cancelAttachment}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  )}
                  <form className={styles.chatInputBar} onSubmit={sendMessage}>
                    <input type="file" style={{ display: 'none' }} ref={fileInputRef} onChange={handleAttachmentChange} accept="image/*" />
                    <button type="button" className={styles.addAttachmentBtn} onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    </button>
                    <input
                      type="text"
                      className={styles.chatInput}
                      placeholder={`Message #${activeChannelName}`}
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      disabled={isSending}
                    />
                    <button type="submit" className={styles.sendBtn} disabled={(!msgInput.trim() && !attachmentFile) || isSending}>
                      {isSending ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinning}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Members sidebar */}
              <aside className={styles.membersSidebar}>
                <div className={styles.membersHeader}>
                  Members — {members.length}
                </div>
                {members.map((m) => (
                  <div key={m.id} className={styles.memberItem}>
                    <div className={styles.memberAvatarWrap}>
                      <div className={styles.memberAvatar} style={{
                        background: m.id === serverData?.ownerId ? '#5865f2' : '#23a559',
                        backgroundImage: m.avatarUrl ? `url(${m.avatarUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: m.avatarUrl ? 'transparent' : 'inherit'
                      }}>
                        {!m.avatarUrl && m.username.charAt(0).toUpperCase()}
                      </div>
                      <div 
                        className={styles.memberDot} 
                        style={{ background: onlineUsers[m.id] ? '#23a559' : '#80848e' }}
                      ></div>
                    </div>
                    <span className={styles.memberName}>{m.username}</span>
                    {m.id === serverData?.ownerId && (
                      <span className={styles.ownerBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#faa61a"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" /></svg>
                      </span>
                    )}
                    {/*call buttons - always show but disabled if offline*/}
                    {(m.id !== userId) && (
                      <div className={styles.memberActions}>
                        <button 
                          className={styles.callBtn} 
                          onClick={() => {
                            if (!onlineUsers[m.id]) {
                              alert('User is not online');
                              return;
                            }
                            startCall({ ...m, socketId: onlineUsers[m.id] }, 'audio');
                          }}
                          title={onlineUsers[m.id] ? "Audio call" : "User offline"}
                          disabled={!onlineUsers[m.id]}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 1.66-1.34 3-3 3s-3-1.34-3-3H5c0 2.21 1.79 4 4 4s4-1.79 4-4h-2z"/></svg>
                        </button>
                        <button 
                          className={styles.callBtn} 
                          onClick={() => {
                            if (!onlineUsers[m.id]) {
                              alert('User is not online');
                              return;
                            }
                            startCall({ ...m, socketId: onlineUsers[m.id] }, 'video');
                          }}
                          title={onlineUsers[m.id] ? "Video call" : "User offline"}
                          disabled={!onlineUsers[m.id]}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </aside>
            </div>
            )}
          </>
        )}
      </main>

      {showSettings && <UserSettings onClose={() => setShowSettings(false)} />}

      {/* VOICE CHANNEL REMOTE AUDIO */}
      {Object.entries(remoteStreams).map(([socketId, stream]) => (
        <audio
          key={socketId}
          autoPlay
          ref={el => { if (el && el.srcObject !== stream) el.srcObject = stream; }}
          muted={isDeafened}
        />
      ))}

      {/* CALL MODAL */}
      {isCallModalOpen && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={handleCallClose}
          socket={socket}
          targetUser={targetUser}
          callType={callType}
          isIncoming={!!incomingCall}
          initialSignal={incomingCall}
          isMuted={isMuted}
          isDeafened={isDeafened}
          onToggleMute={() => setIsMuted(!isMuted)}
          onToggleDeafen={() => setIsDeafened(!isDeafened)}
        />
      )}

      {/* SERVER MODAL GATEKEEPER */}
      {isServerModalOpen && (
        <CreateServerModal
          onClose={() => setIsServerModalOpen(false)}
          onCreated={onServerCreated}
        />
      )}

      {isEditServerModalOpen && (
        <EditServerModal
          server={serverData}
          onClose={() => setIsEditServerModalOpen(false)}
          onUpdated={() => { fetchServers(); fetchServerData(); }}
        />
      )}

      {/* CHANNEL MODAL GATEKEEPER */}
      {isChannelModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 style={{ marginBottom: '24px' }}>Create Channel</h3>
            <form onSubmit={handleCreateChannel}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: newChannelType === 'text' ? 'var(--bg-modifier-selected)' : 'var(--background-secondary)', borderRadius: '4px', border: newChannelType === 'text' ? '1px solid var(--text-link)' : '1px solid transparent' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-normal)' }}>Text</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Send messages, images, GIFs, emoji, opinions, and puns</div>
                  </div>
                  <input type="radio" name="channelType" value="text" checked={newChannelType === 'text'} onChange={() => setNewChannelType('text')} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: newChannelType === 'voice' ? 'var(--bg-modifier-selected)' : 'var(--background-secondary)', borderRadius: '4px', border: newChannelType === 'voice' ? '1px solid var(--text-link)' : '1px solid transparent' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-normal)' }}>Voice</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Hang out together with voice, video, and screen share</div>
                  </div>
                  <input type="radio" name="channelType" value="voice" checked={newChannelType === 'voice'} onChange={() => setNewChannelType('voice')} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                </label>
              </div>

              <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Channel Name</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  {newChannelType === 'text' ? '#' : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>}
                </span>
                <input
                  type="text"
                  placeholder="new-channel"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className={styles.modalInput}
                  style={{ paddingLeft: '32px' }}
                  autoFocus
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsChannelModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.createBtn} disabled={!newChannelName.trim()}>Create Channel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
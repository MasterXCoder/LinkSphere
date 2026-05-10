import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import { useAuth } from '../context/AuthContext';
import CreateServerModal from '../components/CreateServerModal';
import EditServerModal from '../components/EditServerModal';
import Logo from '../components/Logo';
import CallModal from '../components/CallModal';
import styles from "./AppPage.module.css";
import UserSettings from "./UserSettings";

const API = "/api";
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

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
      newSocket.on("call-incoming", ({ signal, from, callType: incomingCallType, callerName }) => {
        const members = serverDataRef.current?.membersData || [];
        const caller = members.find(m => m.socketId === from);
        setTargetUser({ 
          id: caller?.id,
          socketId: from, 
          username: caller?.username || callerName || 'Unknown' 
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
  const isImageAttachment = (mimeType = "", url = "") => {
    if (mimeType && mimeType.startsWith("image/")) return true;
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  };


  // Friend system state
  const [activeHomeTab, setActiveHomeTab] = useState('addFriend');
  const [friendsData, setFriendsData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [friendRequestStatus, setFriendRequestStatus] = useState('');
  const [friendRequestMsg, setFriendRequestMsg] = useState('');
  const [selectedDmFriend, setSelectedDmFriend] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);

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
        body: JSON.stringify({ name: newChannelName, type: "text" }),
      });

      if (res.ok) {
        setNewChannelName("");
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

  // Reset DM panel when friend is no longer in friend list
  useEffect(() => {
    if (!selectedDmFriend) return;
    const stillFriend = friendsData.friends.some((f) => f.id === selectedDmFriend.id);
    if (!stillFriend) {
      setSelectedDmFriend(null);
      setDmMessages([]);
    }
  }, [friendsData.friends, selectedDmFriend]);




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

  const fetchDmMessages = useCallback(async () => {
    if (activeServer !== "home" || !selectedDmFriend?.id) return;
    try {
      const res = await fetch(`${API}/dm/${selectedDmFriend.id}/messages`, {
        headers: authHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        setDmMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch direct messages:", err);
    }
  }, [activeServer, selectedDmFriend, token]);

  useEffect(() => {
    if (activeServer !== "home" || !selectedDmFriend?.id) return;
    fetchDmMessages();
    const interval = setInterval(fetchDmMessages, 3000);
    return () => clearInterval(interval);
  }, [activeServer, selectedDmFriend, fetchDmMessages]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, dmMessages]);

  // ── Send message ──
  const sendMessage = async (e) => {
    e.preventDefault();
    const isDmView = activeServer === "home" && !!selectedDmFriend?.id;
    if ((!msgInput.trim() && !attachmentFile) || isSending) return;
    if (!isDmView && !activeChannel) return;

    try {
      setIsSending(true);
      let finalAttachmentUrl = null;
      let finalAttachmentName = null;
      let finalAttachmentMimeType = null;

      // If there's an attachment, upload it first
      if (attachmentFile) {
        const formData = new FormData();
        formData.append("attachment", attachmentFile);

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
        finalAttachmentName = uploadData.originalName || attachmentFile.name;
        finalAttachmentMimeType = uploadData.mimeType || attachmentFile.type || null;
      }

      if (isDmView) {
        await fetch(`${API}/dm/${selectedDmFriend.id}/messages`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            content: msgInput,
            attachmentUrl: finalAttachmentUrl,
            attachmentName: finalAttachmentName || null,
            attachmentMimeType: finalAttachmentMimeType || null,
          }),
        });
        fetchDmMessages();
      } else {
        await fetch(
          `${API}/servers/${activeServer}/channels/${activeChannel}/messages`,
          {
            method: "POST",
            headers: authHeaders(token),
            body: JSON.stringify({
              content: msgInput,
              attachmentUrl: finalAttachmentUrl,
              attachmentName: finalAttachmentName || null,
              attachmentMimeType: finalAttachmentMimeType || null,
            }),
          }
        );
      }
      setMsgInput("");
      cancelAttachment();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const openFriendDm = (friend) => {
    setSelectedDmFriend(friend);
    setActiveHomeTab("all");
    setMsgInput("");
    cancelAttachment();
  };

  // ── Voice/Video Call Functions ──
  const logCallStartEvent = async (type) => {
    try {
      if (activeServer === "home" && selectedDmFriend?.id) {
        await fetch(`${API}/dm/${selectedDmFriend.id}/call-events`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ callType: type }),
        });
        fetchDmMessages();
      } else if (activeServer && activeServer !== "home" && activeChannel) {
        await fetch(
          `${API}/servers/${activeServer}/channels/${activeChannel}/call-events`,
          {
            method: "POST",
            headers: authHeaders(token),
            body: JSON.stringify({ callType: type }),
          }
        );
      }
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
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        alert("File is too large. Max size is 10MB.");
        e.target.value = null;
        return;
      }
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview);
      }
      setAttachmentFile(file);
      setAttachmentPreview(
        file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null
      );
    }
    // reset input so the same file over and over triggers change
    e.target.value = null;
  };

  const cancelAttachment = () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
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
                <div 
                  className={`${styles.navItem} ${!selectedDmFriend ? styles.activeNavItem : ""}`}
                  onClick={() => setSelectedDmFriend(null)}
                >
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
              {friendsData.friends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  className={`${styles.dmPlaceholder} ${selectedDmFriend?.id === friend.id ? styles.activeNavItem : ""}`}
                  onClick={() => openFriendDm(friend)}
                >
                  <div
                    className={styles.dmAvatarGhost}
                    style={{
                      backgroundImage: friend.avatarUrl ? `url(${friend.avatarUrl})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!friend.avatarUrl ? friend.username.charAt(0).toUpperCase() : null}
                  </div>
                  <div className={styles.friendName}>{friend.username}</div>
                </button>
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
                    onClick={() => setIsChannelModalOpen(true)}
                    title="Create Channel"
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

            </section>
          </>
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
                <div className={styles.headerTitle} style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                  {selectedDmFriend ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={styles.friendAvatarWrap} style={{ width: '28px', height: '28px' }}>
                          <div className={styles.friendAvatar} style={{ backgroundImage: selectedDmFriend.avatarUrl ? `url(${selectedDmFriend.avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', color: selectedDmFriend.avatarUrl ? 'transparent' : 'inherit' }}>
                            {!selectedDmFriend.avatarUrl && selectedDmFriend.username.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.friendDot} style={{ background: onlineUsers[selectedDmFriend.id] ? '#23a559' : '#80848e', width: '10px', height: '10px', bottom: '-2px', right: '-2px', border: '2px solid var(--bg-base)' }}></div>
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDmFriend.username}</span>
                      </div>
                      <div className={styles.dmHeaderRight}>
                        <div className={styles.dmHeaderIcons}>
                          <button className={styles.dmHeaderIconBtn} title="Start Voice Call" onClick={() => {
                            if (!onlineUsers[selectedDmFriend.id]) return alert('User is not online');
                            startCall({ ...selectedDmFriend, socketId: onlineUsers[selectedDmFriend.id] }, 'audio');
                          }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 1.66-1.34 3-3 3s-3-1.34-3-3H5c0 2.21 1.79 4 4 4s4-1.79 4-4h-2z"/></svg>
                          </button>
                          <button className={styles.dmHeaderIconBtn} title="Start Video Call" onClick={() => {
                            if (!onlineUsers[selectedDmFriend.id]) return alert('User is not online');
                            startCall({ ...selectedDmFriend, socketId: onlineUsers[selectedDmFriend.id] }, 'video');
                          }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                          </button>
                          <button className={styles.dmHeaderIconBtn} title="Pinned Messages">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11V5.5C16 3.57 14.43 2 12.5 2S9 3.57 9 5.5V11L7 13v2h4v6h2v-6h4v-2l-2-2z"/></svg>
                          </button>
                          <button className={styles.dmHeaderIconBtn} title="Add Friends to DM">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                          </button>
                          <button className={styles.dmHeaderIconBtn} title="User Profile">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                          </button>
                        </div>
                        <div className={styles.dmSearchBar}>
                          <input type="text" className={styles.dmSearchInput} placeholder="Search" />
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{color: 'var(--text-muted)'}}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" /></svg>
                      Friends
                    </>
                  )}
                </div>
                {!selectedDmFriend && (
                  <>
                    <div className={styles.headerDivider}></div>
                    <div className={styles.headerTabs}>
                      <button className={`${styles.tabBtn} ${activeHomeTab === 'online' ? styles.activeTabBtn : ''}`} onClick={() => setActiveHomeTab('online')}>Online</button>
                      <button className={`${styles.tabBtn} ${activeHomeTab === 'all' ? styles.activeTabBtn : ''}`} onClick={() => setActiveHomeTab('all')}>All</button>
                      <button className={`${styles.tabBtn} ${activeHomeTab === 'pending' ? styles.activeTabBtn : ''}`} onClick={() => setActiveHomeTab('pending')}>Pending{friendsData.incoming.length > 0 && <span className={styles.pendingBadge}>{friendsData.incoming.length}</span>}</button>
                      <button className={`${styles.tabBtn} ${activeHomeTab === 'addFriend' ? styles.activeTabBtn : ''}`} onClick={() => { setActiveHomeTab('addFriend'); setFriendRequestMsg(''); }}>Add Friend</button>
                    </div>
                  </>
                )}
              </div>
            </header>
            <div className={styles.friendsLayout}>
              {selectedDmFriend ? (
                <>
                  <div className={styles.chatArea}>
                    <div className={styles.messageList}>
                      {dmMessages.length === 0 && (
                        <div className={styles.welcomeMsg}>
                          <div className={styles.welcomeHash} style={{ borderRadius: '50%', width: '80px', height: '80px', fontSize: '32px', backgroundImage: selectedDmFriend.avatarUrl ? `url(${selectedDmFriend.avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', color: selectedDmFriend.avatarUrl ? 'transparent' : 'inherit' }}>
                            {!selectedDmFriend.avatarUrl && selectedDmFriend.username.charAt(0).toUpperCase()}
                          </div>
                          <h2 className={styles.welcomeTitle}>{selectedDmFriend.username}</h2>
                          <h3 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>{selectedDmFriend.username.toLowerCase().replace(/\s/g, '_')}xo</h3>
                          <p className={styles.welcomeDesc}>This is the beginning of your direct message history with <strong>{selectedDmFriend.username}</strong>.</p>
                          <div className={styles.dmEmptyActions}>
                            <div className={styles.mutualServers}>
                              <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="32" cy="32" r="32" fill="#5865f2" />
                                <text x="12" y="44" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="36" fill="#fff">ls</text>
                              </svg>
                              3 Mutual Servers
                            </div>
                            <span style={{color: 'var(--text-muted)'}}>•</span>
                            <button className={styles.dmEmptyActionBtn}>Remove Friend</button>
                            <button className={styles.dmEmptyActionBtn}>Block</button>
                          </div>
                        </div>
                      )}
                      {dmMessages.map((msg) => {
                        if (msg.type === "system") {
                          return (
                            <div key={msg.id} className={msg.systemKind === "call_started" ? styles.callSystemMsg : styles.systemMsg}>
                              {msg.systemKind === "call_started" ? (
                                <div className={styles.callSystemIcon}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16.42v3.54a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 1.14 4.18 2 2 0 0 1 3.13 2h3.54a2 2 0 0 1 2 1.72c.12.89.35 1.76.68 2.59a2 2 0 0 1-.45 2.11L7.42 9.9a16 16 0 0 0 6.68 6.68l1.48-1.48a2 2 0 0 1 2.11-.45c.83.33 1.7.56 2.59.68A2 2 0 0 1 21 16.42z" /></svg>
                                </div>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13 12H3" /></svg>
                              )}
                              <span className={msg.systemKind === "call_started" ? styles.callSystemText : ""}>{msg.content}</span>
                              <span className={styles.msgTimestamp}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        }
                        const isOwn = msg.senderId === userId;
                        return (
                          <div key={msg.id} className={styles.message}>
                            <div className={styles.msgAvatarCircle} style={{
                              background: isOwn ? '#5865f2' : '#23a559',
                              backgroundImage: !isOwn && selectedDmFriend.avatarUrl ? `url(${selectedDmFriend.avatarUrl})` : (isOwn && auth.user?.avatarUrl ? `url(${auth.user.avatarUrl})` : 'none'),
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              color: (!isOwn && selectedDmFriend.avatarUrl) || (isOwn && auth.user?.avatarUrl) ? 'transparent' : 'inherit'
                            }}>
                              {isOwn
                                ? (!auth.user?.avatarUrl && username.charAt(0).toUpperCase())
                                : (!selectedDmFriend.avatarUrl && selectedDmFriend.username.charAt(0).toUpperCase())}
                            </div>
                            <div className={styles.msgContent}>
                              <div className={styles.msgHeader}>
                                <span className={styles.msgAuthor} style={{ color: isOwn ? '#949cf7' : '#57f287' }}>
                                  {isOwn ? username : selectedDmFriend.username}
                                </span>
                                <span className={styles.msgTimestamp}>
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {msg.content && <p className={styles.msgBody}>{msg.content}</p>}
                              {msg.attachmentUrl && (
                                <div className={styles.msgAttachmentWrap}>
                                  {isImageAttachment(msg.attachmentMimeType, msg.attachmentUrl) ? (
                                    <img src={msg.attachmentUrl} alt="attachment" className={styles.msgAttachment} />
                                  ) : (
                                    <a
                                      href={msg.attachmentUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={styles.fileAttachmentLink}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                      <span>{msg.attachmentName || "Download attachment"}</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    <div className={styles.chatInputContainer}>
                      {attachmentPreview && (
                        <div className={styles.attachmentPreviewWrap}>
                          <img src={attachmentPreview} alt="preview" className={styles.attachmentPreviewImg} />
                          <button type="button" className={styles.cancelAttachmentBtn} onClick={cancelAttachment}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      )}
                      {!attachmentPreview && attachmentFile && (
                        <div className={styles.attachmentPreviewWrap}>
                          <div className={styles.filePreviewRow}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            <span className={styles.filePreviewName}>{attachmentFile.name}</span>
                          </div>
                          <button type="button" className={styles.cancelAttachmentBtn} onClick={cancelAttachment}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      )}
                      <form className={styles.chatInputBar} onSubmit={sendMessage} style={{ paddingRight: 0 }}>
                        <input type="file" style={{ display: 'none' }} ref={fileInputRef} onChange={handleAttachmentChange} />
                        <button type="button" className={styles.addAttachmentBtn} onClick={() => fileInputRef.current?.click()} disabled={isSending} style={{ background: 'var(--bg-raised)', border: 'none', color: 'var(--text-primary)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                        </button>
                        <input
                          type="text"
                          className={styles.chatInput}
                          placeholder={`Message @${selectedDmFriend.username}`}
                          value={msgInput}
                          onChange={(e) => setMsgInput(e.target.value)}
                          disabled={isSending}
                        />
                        <div className={styles.chatInputRightIcons}>
                          <button type="button" className={styles.chatInputIconBtn} title="Gift">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10zm-11 5v-4H7l4-5v4h4l-4 5z"/></svg>
                          </button>
                          <button type="button" className={styles.chatInputIconBtn} title="GIF">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 9H13v6h-1.5zM9 9H6c-.6 0-1 .5-1 1v4c0 .5.4 1 1 1h3c.6 0 1-.5 1-1v-2H8.5v1.5h-1.5v-3H10V10c0-.5-.4-1-1-1zm10 1.5V9h-4.5v6H16v-2h2v-1.5h-2v-1h3z"/></svg>
                          </button>
                          <button type="button" className={styles.chatInputIconBtn} title="Sticker">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                          </button>
                          <button type="button" className={styles.chatInputIconBtn} title="Emoji">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
                          </button>
                          <button type="submit" className={styles.sendBtn} disabled={(!msgInput.trim() && !attachmentFile) || isSending} style={{ marginLeft: 0 }}>
                            {isSending ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinning}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  <aside className={styles.dmProfileSidebar}>
                    <div className={styles.profileBanner}>
                      <div className={styles.profileAvatarWrapper}>
                        <div className={styles.profileAvatarLarge} style={{ backgroundImage: selectedDmFriend.avatarUrl ? `url(${selectedDmFriend.avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', color: selectedDmFriend.avatarUrl ? 'transparent' : 'inherit' }}>
                          {!selectedDmFriend.avatarUrl && selectedDmFriend.username.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.profileStatusDotLarge} style={{ background: onlineUsers[selectedDmFriend.id] ? '#23a559' : '#80848e' }}></div>
                      </div>
                    </div>
                    <div className={styles.profileContent}>
                      <div className={styles.profileHeader}>
                        <h2 className={styles.profileName}>{selectedDmFriend.username}</h2>
                        <div className={styles.profileUsername}>
                          {selectedDmFriend.username.toLowerCase().replace(/\s/g, '_')}xo
                          <div className={styles.profileBadges}>
                            <span className={styles.profileBadge} style={{ color: '#c4b5fd', background: 'rgba(124, 58, 237, 0.15)' }}>♥ MEOW</span>
                            <span className={styles.profileBadge} style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.15)' }}>✔</span>
                            <span className={styles.profileBadge} style={{ color: '#60a5fa', background: 'rgba(59, 130, 246, 0.15)' }}>#</span>
                            <span className={styles.profileBadge} style={{ color: '#34d399', background: 'rgba(52, 211, 153, 0.15)' }}>✿</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.profileSection}>
                        <h3 className={styles.profileSectionTitle}>Bio</h3>
                        <p className={styles.profileSectionContent}>Vigilante</p>
                      </div>

                      <div className={styles.profileSection}>
                        <h3 className={styles.profileSectionTitle}>Member Since</h3>
                        <p className={styles.profileSectionContent}>30 Oct 2022</p>
                      </div>

                      <div className={styles.profileSection}>
                        <h3 className={styles.profileSectionTitle}>Game Collection</h3>
                        <div className={styles.gameCollection}>
                          <div className={styles.gameIcon} style={{ fontSize: '13px', fontWeight: 'bold' }}>33</div>
                          <div className={styles.gameIcon} style={{ background: 'transparent' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg></div>
                          <div className={styles.gameIcon} style={{ background: 'transparent' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg></div>
                          <div className={styles.gameIcon} style={{ background: 'transparent' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
                        </div>
                      </div>

                      <div className={styles.fullProfileLink}>View Full Profile</div>
                    </div>
                  </aside>
                </>
              ) : (
              <>
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
                            <button className={styles.friendActionBtn} title="Message" onClick={() => openFriendDm(f)}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></button>
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
                            <button className={styles.friendActionBtn} title="Message" onClick={() => openFriendDm(f)}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></button>
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
              </>
              )}
            </div>
          </>
        ) : (
          <>
            <header className={styles.topHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.hash} style={{ marginRight: 8 }}>#</span>
                <span className={styles.headerTitle}>{activeChannelName}</span>
              </div>
              <div className={styles.headerRight}>
                <span className={styles.memberCount}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" /></svg>
                  {members.length}
                </span>
              </div>
            </header>

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
                              {isImageAttachment(msg.attachmentMimeType, msg.attachmentUrl) ? (
                                <img src={msg.attachmentUrl} alt="attachment" className={styles.msgAttachment} />
                              ) : (
                                <a
                                  href={msg.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.fileAttachmentLink}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                  <span>{msg.attachmentName || "Download attachment"}</span>
                                </a>
                              )}
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
                  {!attachmentPreview && attachmentFile && (
                    <div className={styles.attachmentPreviewWrap}>
                      <div className={styles.filePreviewRow}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        <span className={styles.filePreviewName}>{attachmentFile.name}</span>
                      </div>
                      <button type="button" className={styles.cancelAttachmentBtn} onClick={cancelAttachment}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  )}
                  <form className={styles.chatInputBar} onSubmit={sendMessage}>
                    <input type="file" style={{ display: 'none' }} ref={fileInputRef} onChange={handleAttachmentChange} />
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
          </>
        )}
      </main>

      {showSettings && <UserSettings onClose={() => setShowSettings(false)} />}

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
            <h3>Create Channel</h3>
            <form onSubmit={handleCreateChannel}>

              <input
                type="text"
                placeholder="new-channel"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className={styles.modalInput}
                autoFocus
              />
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
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './UserSettings.module.css';
import { THEMES, saveTheme } from '../utils/theme.js';

export default function UserSettings({ onClose }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const username = auth.user?.username || "User";
  const email = auth.user?.email || "user@example.com";
  const hasPassword = auth.user?.hasPassword !== false;

  // Fetch fresh user data on mount to sync hasPassword from the database
  useEffect(() => {
    const syncUser = async () => {
      try {
        const userId = auth.user?.id;
        if (!userId || !auth.token) return;
        const res = await fetch(`/api/users/${userId}`, {
          headers: { "Authorization": `Bearer ${auth.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.hasPassword !== undefined) {
            auth.updateUser({ hasPassword: data.hasPassword });
          }
        }
      } catch (err) {
        // silently ignore — worst case they see stale data
      }
    };
    syncUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mask email for display
  const [showEmail, setShowEmail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // User details state (so we can update them in the UI without refresh)
  const [currentUsername, setCurrentUsername] = useState(username);
  const [currentEmail, setCurrentEmail] = useState(email);

  // Edit fields state
  const [editMode, setEditMode] = useState(null); // 'username' | 'email' | null
  const [editValue, setEditValue] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Change Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Add Password state (for Google users without a password)
  const [showAddPasswordModal, setShowAddPasswordModal] = useState(false);
  const [addPwNew, setAddPwNew] = useState("");
  const [addPwConfirm, setAddPwConfirm] = useState("");
  const [addPwLoading, setAddPwLoading] = useState(false);
  const [addPwError, setAddPwError] = useState("");
  const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);
  const avatarInputRef = useRef(null);

  // Settings tab
  const [settingsTab, setSettingsTab] = useState('account');

  // Appearance state
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('ls-theme') || 'dark');
  const [fontSize,    setFontSize]    = useState(() => Number(localStorage.getItem('ls-fontsize')  || 14));
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('ls-compact') === 'true');

  // Content & Social state
  const [autoPlayGifs,    setAutoPlayGifs]    = useState(() => localStorage.getItem('ls-gifs')    !== 'false');
  const [showEmbeds,      setShowEmbeds]      = useState(() => localStorage.getItem('ls-embeds')  !== 'false');
  const [largEmoji,       setLargeEmoji]      = useState(() => localStorage.getItem('ls-emoji')   === 'true');
  const [showLinkPreview, setShowLinkPreview] = useState(() => localStorage.getItem('ls-links')   !== 'false');

  // Data & Privacy state
  const [analyticsOpt,    setAnalyticsOpt]    = useState(() => localStorage.getItem('ls-analytics') !== 'false');
  const [readReceipts,    setReadReceipts]    = useState(() => localStorage.getItem('ls-receipts')  !== 'false');

  // Notifications state
  const [notifEnabled,    setNotifEnabled]    = useState(() => localStorage.getItem('ls-notif')    !== 'false');
  const [notifSound,      setNotifSound]      = useState(() => localStorage.getItem('ls-notifsnd') !== 'false');
  const [notifMentionOnly,setNotifMentionOnly]= useState(() => localStorage.getItem('ls-mention')  === 'true');
  const [notifPermission, setNotifPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'default'));

  // Accessibility state
  const [reduceMotion,    setReduceMotion]    = useState(() => localStorage.getItem('ls-motion')   === 'true');
  const [highContrast,    setHighContrast]    = useState(() => localStorage.getItem('ls-contrast')  === 'true');
  const [msgGrouping,     setMsgGrouping]     = useState(() => localStorage.getItem('ls-grouping') !== 'false');

  // Voice & Video state
  const [echoCancellation,  setEchoCancellation]  = useState(() => localStorage.getItem('ls-echo')  !== 'false');
  const [noiseSuppression,  setNoiseSuppression]  = useState(() => localStorage.getItem('ls-noise') !== 'false');
  const [pttKey,            setPttKey]            = useState(() => localStorage.getItem('ls-ptt')   || 'None');
  const [audioDevices,      setAudioDevices]      = useState({ inputs: [], outputs: [] });
  const [selectedInput,     setSelectedInput]     = useState(() => localStorage.getItem('ls-audioin')  || '');
  const [selectedOutput,    setSelectedOutput]    = useState(() => localStorage.getItem('ls-audioout') || '');

  // Language & Time state
  const [language,    setLanguage]    = useState(() => localStorage.getItem('ls-lang')     || 'en');
  const [timeFormat,  setTimeFormat]  = useState(() => localStorage.getItem('ls-timefmt')  || '12h');
  const [dateFormat,  setDateFormat]  = useState(() => localStorage.getItem('ls-datefmt')  || 'MDY');

  // Friends state
  const [friendsData, setFriendsData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [settingsFriendInput, setSettingsFriendInput] = useState('');
  const [settingsFriendMsg, setSettingsFriendMsg] = useState('');
  const [settingsFriendStatus, setSettingsFriendStatus] = useState('');

  const fetchSettingsFriends = useCallback(async () => {
    try {
      const res = await fetch(`/api/friends`, {
        headers: { "Authorization": `Bearer ${auth.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriendsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    }
  }, [auth.token]);

  useEffect(() => {
    if (settingsTab === 'friends') fetchSettingsFriends();
  }, [settingsTab, fetchSettingsFriends]);

  const handleSettingsSendRequest = async () => {
    if (!settingsFriendInput.trim()) return;
    setSettingsFriendMsg('');
    setSettingsFriendStatus('');
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
        body: JSON.stringify({ toUsername: settingsFriendInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsFriendStatus('success');
        setSettingsFriendMsg(data.message || 'Friend request sent!');
        setSettingsFriendInput('');
        fetchSettingsFriends();
      } else {
        setSettingsFriendStatus('error');
        setSettingsFriendMsg(data.error || 'Failed to send request');
      }
    } catch { setSettingsFriendStatus('error'); setSettingsFriendMsg('Could not connect'); }
  };

  const handleSettingsAccept = async (fromId) => {
    await fetch('/api/friends/accept', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` }, body: JSON.stringify({ fromId }) });
    fetchSettingsFriends();
  };

  const handleSettingsDecline = async (fromId) => {
    await fetch('/api/friends/decline', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` }, body: JSON.stringify({ fromId }) });
    fetchSettingsFriends();
  };

  const handleSettingsRemove = async (friendId) => {
    await fetch(`/api/friends/${friendId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${auth.token}` } });
    fetchSettingsFriends();
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarUploadLoading(true);
    setEditError("");
    setSuccessToast("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${auth.token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        alert(errorData.error || "Failed to upload avatar image.");
        setAvatarUploadLoading(false);
        return;
      }

      const uploadData = await uploadRes.json();
      const newAvatarUrl = uploadData.url;

      const updateRes = await fetch(`/api/users/${auth.user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth.token}`
        },
        body: JSON.stringify({ avatarUrl: newAvatarUrl })
      });

      if (updateRes.ok) {
        const updateData = await updateRes.json();
        auth.updateUser({ avatarUrl: newAvatarUrl, ...(updateData.user?.hasPassword !== undefined ? { hasPassword: updateData.user.hasPassword } : {}) });
        setSuccessToast("Avatar updated successfully!");
      } else {
        setEditError("Failed to update avatar.");
      }
    } catch (err) {
      console.error(err);
      setEditError("Could not connect to server.");
    } finally {
      setAvatarUploadLoading(false);
    }
  };

  const maskedEmail = currentEmail.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);

    try {
      // 1. Verify password via login endpoint (since there's no dedicated verify route)
      const cachedEmail = auth.user?.email;
      const loginRes = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cachedEmail, password: editPassword })
      });

      if (!loginRes.ok) {
        setEditError("Password does not match.");
        setEditLoading(false);
        return;
      }

      const loginData = await loginRes.json();
      const newToken = loginData.token;

      // Update the token so the user doesn't get logged out randomly
      auth.updateToken(newToken);

      // 2. Perform the update
      const userId = auth.user?.id;
      const body = {};
      if (editMode === 'username') body.username = editValue;
      if (editMode === 'email') body.email = editValue;

      const updateRes = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${newToken}`
        },
        body: JSON.stringify(body)
      });

      if (updateRes.ok) {
        if (editMode === 'username') {
          auth.updateUser({ username: editValue });
          setCurrentUsername(editValue);
          setSuccessToast("Username successfully updated!");
        }
        if (editMode === 'email') {
          auth.updateUser({ email: editValue });
          setCurrentEmail(editValue);
          setSuccessToast("Email successfully updated!");
        }

        // Show lightweight toast or just close
        setEditMode(null);
        setEditValue("");
        setEditPassword("");
        setTimeout(() => setSuccessToast(""), 3000);
      } else {
        const json = await updateRes.json();
        setEditError(json.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setEditError("Could not connect to server.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setSuccessToast(""); // Clear any previous success toast

    if (passwordNew !== passwordConfirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordNew.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);

    try {
      // 1. Verify current password via login endpoint
      const cachedEmail = auth.user?.email;
      const loginRes = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cachedEmail, password: passwordCurrent })
      });

      if (!loginRes.ok) {
        setPasswordError("Current password is incorrect.");
        setPasswordLoading(false);
        return;
      }

      const loginData = await loginRes.json();
      const newToken = loginData.token;
      auth.updateToken(newToken);

      // 2. Perform the update with new password
      const userId = auth.user?.id;
      const updateRes = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${newToken}`
        },
        body: JSON.stringify({ password: passwordNew })
      });

      if (updateRes.ok) {
        setShowPasswordModal(false);
        setPasswordCurrent("");
        setPasswordNew("");
        setPasswordConfirm("");
        setSuccessToast("Password successfully changed!");
        // No logout needed for changing password, but the session is authenticated
        setTimeout(() => setSuccessToast(""), 3000);
      } else {
        const json = await updateRes.json();
        setPasswordError(json.error || "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      setPasswordError("Could not connect to server.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Add Password (for Google OAuth users) ───────────────────────────────────
  const handleAddPassword = async (e) => {
    e.preventDefault();
    setAddPwError("");

    if (addPwNew !== addPwConfirm) {
      setAddPwError("Passwords do not match.");
      return;
    }
    if (addPwNew.length < 6) {
      setAddPwError("Password must be at least 6 characters.");
      return;
    }

    setAddPwLoading(true);

    try {
      const userId = auth.user?.id;
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth.token}`
        },
        body: JSON.stringify({ password: addPwNew })
      });

      if (res.ok) {
        const data = await res.json();
        auth.updateUser({ hasPassword: data.user?.hasPassword ?? true });
        setShowAddPasswordModal(false);
        setAddPwNew("");
        setAddPwConfirm("");
        setSuccessToast("Password added successfully!");
        setTimeout(() => setSuccessToast(""), 3000);
      } else {
        const json = await res.json();
        setAddPwError(json.error || "Failed to set password.");
      }
    } catch (err) {
      console.error(err);
      setAddPwError("Could not connect to server.");
    } finally {
      setAddPwLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setIsDeleting(true);
    setDeleteError("");

    try {
      // 1. Verify password via login endpoint
      const cachedEmail = auth.user?.email;
      const loginRes = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cachedEmail, password: deletePassword })
      });

      if (!loginRes.ok) {
        setDeleteError("Password does not match.");
        setIsDeleting(false);
        return;
      }

      const loginData = await loginRes.json();
      const newToken = loginData.token;

      // 2. Perform the delete with fresh valid token
      const userId = auth.user?.id;
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${newToken}`
        }
      });

      if (res.ok) {
        setShowDeleteConfirm(false);
        setSuccessToast("Account deleted successfully! Redirecting...");
        setTimeout(() => {
          handleLogout();
        }, 2000);
      } else {
        const json = await res.json();
        setDeleteError(json.error || "Failed to delete account");
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      setDeleteError("Could not connect to server.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    onClose();
    navigate("/");
  };

  const NavItem = ({ label, icon, active, badge, danger, onClick }) => (
    <div
      className={`${styles.navItem} ${active ? styles.activeNavItem : ''} ${danger ? styles.logoutItem : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {icon}
      <span>{label}</span>
      {badge && <span className={styles.newBadge}>{badge}</span>}
    </div>
  );

  return (
    <div className={styles.overlay}>
      {/* Left Sidebar Menu */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          {/* Top Profile Snippet */}
          <div className={styles.profileSnippet}>
            <div className={styles.snippetAvatar} style={{
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundImage: auth.user?.avatarUrl ? `url(${auth.user.avatarUrl})` : 'none',
              color: auth.user?.avatarUrl ? 'transparent' : 'inherit'
            }}>
              {!auth.user?.avatarUrl && currentUsername.charAt(0).toUpperCase()}
            </div>
            <div className={styles.snippetInfo}>
              <div className={styles.snippetName}>{currentUsername}</div>
              <div className={styles.editProfileLink}>
                Edit Profile <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </div>
            </div>
          </div>

          <div className={styles.searchBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#949ba4" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search" />
          </div>

          <div className={styles.navSection}>
            <div className={styles.navHeader}>User Settings</div>
            <NavItem label="My Account" active={settingsTab === 'account'} onClick={() => setSettingsTab('account')} />
            <NavItem label="Friends" active={settingsTab === 'friends'} onClick={() => setSettingsTab('friends')} badge={friendsData.incoming.length > 0 ? friendsData.incoming.length : undefined} />
            <NavItem label="Content &amp; Social" active={settingsTab === 'content'} onClick={() => setSettingsTab('content')} />
            <NavItem label="Data &amp; Privacy" active={settingsTab === 'privacy'} onClick={() => setSettingsTab('privacy')} />
            <NavItem label="Notifications" active={settingsTab === 'notifications'} onClick={() => setSettingsTab('notifications')} />
            <NavItem label="Connections" active={settingsTab === 'connections'} onClick={() => setSettingsTab('connections')} />
          </div>

          <div className={styles.divider} />

          <div className={styles.navSection}>
            <div className={styles.navHeader}>App Settings</div>
            <NavItem label="Appearance" active={settingsTab === 'appearance'} onClick={() => setSettingsTab('appearance')} />
            <NavItem label="Accessibility" active={settingsTab === 'accessibility'} onClick={() => setSettingsTab('accessibility')} />
            <NavItem label="Voice &amp; Video" active={settingsTab === 'voice'} onClick={() => setSettingsTab('voice')} />
            <NavItem label="Language &amp; Time" active={settingsTab === 'language'} onClick={() => setSettingsTab('language')} />
          </div>

          <div className={styles.divider} />

          <div className={styles.navSection}>
            <NavItem
              label="Log Out"
              danger={true}
              onClick={handleLogout}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>}
            />
          </div>
        </div>
      </div>

      {/* Right Main Content */}
      <div className={styles.mainArea}>
        <div className={styles.contentWrapper}>
          {settingsTab === 'account' && (
            <>
              <h2 className={styles.pageTitle}>My Account</h2>

              <div className={styles.accountCard}>
                <div className={styles.cardBanner}></div>

                <div className={styles.cardHeader}>
                  <div
                    className={styles.cardAvatarWrapper}
                    style={{
                      background: '#5865f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      position: 'relative',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundImage: auth.user?.avatarUrl ? `url(${auth.user.avatarUrl})` : 'none'
                    }}
                    onClick={() => avatarInputRef.current?.click()}
                    title="Change Avatar"
                  >
                    {!auth.user?.avatarUrl && currentUsername.charAt(0).toUpperCase()}
                    {avatarUploadLoading && <div style={{ position: 'absolute', background: 'rgba(0,0,0,0.5)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>...</div>}
                    <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} style={{ display: "none" }} accept="image/*" />
                  </div>

                  <div className={styles.cardUserInfo}>
                    <span className={styles.cardName}>{currentUsername}</span>
                  </div>

                  <button className={styles.editProfileBtn}>Edit User Profile</button>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoRow}>
                    <div>
                      <div className={styles.infoLabel}>Display Name</div>
                      <div className={styles.infoValue}>{currentUsername}</div>
                    </div>
                    <button className={styles.editBtn} onClick={() => { setEditMode('username'); setEditValue(currentUsername); setEditError(''); setEditPassword(''); }}>Edit</button>
                  </div>

                  <div className={styles.infoRow}>
                    <div>
                      <div className={styles.infoLabel}>Username</div>
                      <div className={styles.infoValue}>{currentUsername}</div>
                    </div>
                    <button className={styles.editBtn} onClick={() => { setEditMode('username'); setEditValue(currentUsername); setEditError(''); setEditPassword(''); }}>Edit</button>
                  </div>

                  <div className={styles.infoRow}>
                    <div>
                      <div className={styles.infoLabel}>Email</div>
                      <div className={styles.infoValue}>
                        {showEmail ? currentEmail : maskedEmail}{' '}
                        <span className={styles.revealText} onClick={() => setShowEmail(!showEmail)} style={{ cursor: 'pointer' }}>
                          {showEmail ? 'Hide' : 'Reveal'}
                        </span>
                      </div>
                    </div>
                    <button className={styles.editBtn} onClick={() => { setEditMode('email'); setEditValue(currentEmail); setEditError(''); setEditPassword(''); }}>Edit</button>
                  </div>

                  <div className={styles.infoRow}>
                    <div>
                      <div className={styles.infoLabel}>Phone Number</div>
                      <div className={styles.infoValue}>You haven't added a phone number yet.</div>
                    </div>
                    <button className={styles.editBtn}>Add</button>
                  </div>
                </div>
              </div>

              {/* Password and Authentication */}
              <div className={styles.sectionContainer}>
                <h2 className={styles.sectionTitle}>Password and Authentication</h2>
                {hasPassword ? (
                  <button className={styles.primaryBtn} onClick={() => { setShowPasswordModal(true); setPasswordError(""); }}>Change Password</button>
                ) : (
                  <button className={styles.primaryBtn} onClick={() => { setShowAddPasswordModal(true); setAddPwError(""); }}>Add Password</button>
                )}
              </div>

              <div className={styles.sectionDivider}></div>

              {/* Account Removal */}
              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h3 className={styles.blockTitle}>Account Removal</h3>
                <p className={styles.blockDesc}>
                  Disabling your account means you can recover it at any time after taking this action.
                </p>
                <div className={styles.buttonGroup}>
                  <button className={styles.dangerBtn}>Disable Account</button>
                  <button className={styles.dangerGhostBtn} onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
                </div>
              </div>
            </>
          )}

          {/* ── Friends Tab ── */}
          {settingsTab === 'friends' && (
            <>
              <h2 className={styles.pageTitle}>Friends</h2>

              {/* Add Friend Section */}
              <div className={styles.sectionContainer}>
                <h2 className={styles.sectionTitle}>Add Friend</h2>
                <p className={styles.blockDesc} style={{ marginBottom: '12px' }}>You can add friends with their LinkSphere username.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Enter a username"
                    value={settingsFriendInput}
                    onChange={(e) => setSettingsFriendInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSettingsSendRequest()}
                    style={{ flex: 1 }}
                  />
                  <button className={styles.primaryBtn} onClick={handleSettingsSendRequest} disabled={!settingsFriendInput.trim()}>Send Request</button>
                </div>
                {settingsFriendMsg && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, background: settingsFriendStatus === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: settingsFriendStatus === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${settingsFriendStatus === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                    {settingsFriendMsg}
                  </div>
                )}
              </div>

              {/* Pending Requests */}
              {(friendsData.incoming.length > 0 || friendsData.outgoing.length > 0) && (
                <div className={styles.sectionContainer}>
                  <h2 className={styles.sectionTitle}>Pending Requests</h2>
                  {friendsData.incoming.map(f => (
                    <div key={`in-${f.id}`} className={styles.infoRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem', backgroundImage: f.avatarUrl ? `url(${f.avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                          {!f.avatarUrl && f.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.infoLabel}>{f.username}</div>
                          <div className={styles.infoValue} style={{ fontSize: '11px' }}>Incoming request</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className={styles.primaryBtn} style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleSettingsAccept(f.id)}>Accept</button>
                        <button className={styles.dangerGhostBtn} style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleSettingsDecline(f.id)}>Decline</button>
                      </div>
                    </div>
                  ))}
                  {friendsData.outgoing.map(f => (
                    <div key={`out-${f.id}`} className={styles.infoRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem', backgroundImage: f.avatarUrl ? `url(${f.avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                          {!f.avatarUrl && f.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.infoLabel}>{f.username}</div>
                          <div className={styles.infoValue} style={{ fontSize: '11px' }}>Outgoing request</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Friend List */}
              <div className={styles.sectionContainer}>
                <h2 className={styles.sectionTitle}>All Friends — {friendsData.friends.length}</h2>
                {friendsData.friends.length === 0 ? (
                  <p className={styles.blockDesc}>You don't have any friends yet. Use the input above to send a friend request!</p>
                ) : (
                  friendsData.friends.map(f => (
                    <div key={f.id} className={styles.infoRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem', backgroundImage: f.avatarUrl ? `url(${f.avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                          {!f.avatarUrl && f.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.infoLabel}>{f.username}</div>
                        </div>
                      </div>
                      <button className={styles.dangerGhostBtn} style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleSettingsRemove(f.id)}>Remove</button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          {/* ── Appearance Tab ── */}
          {settingsTab === 'appearance' && (
            <>
              <h2 className={styles.pageTitle}>Appearance</h2>

              {/* ── Theme selector ── */}
              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Theme</h2>
                <p className={styles.blockDesc}>Choose a theme to personalise your LinkSphere experience. Changes apply instantly.</p>

                <div className={styles.themeGrid}>
                  {Object.values(THEMES).map(theme => (
                    <button
                      key={theme.id}
                      className={`${styles.themeCard} ${activeTheme === theme.id ? styles.themeCardActive : ''}`}
                      onClick={() => {
                        setActiveTheme(theme.id);
                        saveTheme(theme.id);
                      }}
                    >
                      {/* Colour swatch row */}
                      <div className={styles.themeSwatch}>
                        {theme.preview.map((c, i) => (
                          <div key={i} className={styles.themeSwatchDot} style={{ background: c }} />
                        ))}
                      </div>
                      <div className={styles.themeCardLabel}>
                        <span className={styles.themeEmoji}>{theme.emoji}</span>
                        <span className={styles.themeCardName}>{theme.label}</span>
                      </div>
                      <div className={styles.themeCardDesc}>{theme.description}</div>
                      {activeTheme === theme.id && (
                        <div className={styles.themeActiveCheck}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.sectionDivider} />

              {/* ── Font size ── */}
              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Chat Font Size</h2>
                <p className={styles.blockDesc}>Adjust the base font size used in chat messages.</p>
                <div className={styles.sliderRow}>
                  <span className={styles.sliderLabel}>12px</span>
                  <input
                    type="range"
                    min={12} max={20} step={1}
                    value={fontSize}
                    className={styles.themeSlider}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setFontSize(v);
                      localStorage.setItem('ls-fontsize', v);
                      document.documentElement.style.setProperty('--chat-font-size', `${v}px`);
                    }}
                  />
                  <span className={styles.sliderLabel}>20px</span>
                  <span className={styles.sliderValue}>{fontSize}px</span>
                </div>
                {/* Live preview */}
                <div className={styles.fontPreview} style={{ fontSize: `${fontSize}px` }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-1)' }}>Master Mind</span>
                  {' '}<span style={{ color: 'var(--text-muted)', fontSize: '0.75em' }}>Today at 12:34 PM</span>
                  <div style={{ marginTop: 4, color: 'var(--text-primary)' }}>Hey, this is what your messages will look like!</div>
                </div>
              </div>

              <div className={styles.sectionDivider} />

              {/* ── Compact mode ── */}
              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <div className={styles.toggleRow}>
                  <div>
                    <h2 className={styles.sectionTitle} style={{ marginBottom: 4 }}>Compact Mode</h2>
                    <p className={styles.blockDesc} style={{ marginBottom: 0 }}>Reduce spacing between messages to fit more content on screen.</p>
                  </div>
                  <button
                    className={`${styles.toggleBtn} ${compactMode ? styles.toggleBtnOn : ''}`}
                    onClick={() => {
                      const next = !compactMode;
                      setCompactMode(next);
                      localStorage.setItem('ls-compact', next);
                      document.documentElement.dataset.compact = next ? 'true' : 'false';
                    }}
                    aria-pressed={compactMode}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Content & Social ── */}
          {settingsTab === 'content' && (
            <>
              <h2 className={styles.pageTitle}>Content &amp; Social</h2>

              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Media &amp; Links</h2>
                {[
                  { label: 'Auto-play GIFs', desc: 'Automatically animate GIFs in chat.', val: autoPlayGifs, set: setAutoPlayGifs, key: 'ls-gifs' },
                  { label: 'Show Image Embeds', desc: 'Preview images shared via URLs.', val: showEmbeds, set: setShowEmbeds, key: 'ls-embeds' },
                  { label: 'Show Link Previews', desc: 'Display rich preview cards for links.', val: showLinkPreview, set: setShowLinkPreview, key: 'ls-links' },
                  { label: 'Large Emoji', desc: 'Display emoji at a larger size when sent alone.', val: largEmoji, set: setLargeEmoji, key: 'ls-emoji' },
                ].map(({ label, desc, val, set, key }) => (
                  <div key={key} className={styles.toggleRow} style={{ marginBottom: 20 }}>
                    <div>
                      <div className={styles.blockTitle}>{label}</div>
                      <div className={styles.blockDesc} style={{ marginBottom: 0 }}>{desc}</div>
                    </div>
                    <button className={`${styles.toggleBtn} ${val ? styles.toggleBtnOn : ''}`}
                      onClick={() => { const n = !val; set(n); localStorage.setItem(key, n); }}
                      aria-pressed={val}>
                      <div className={styles.toggleKnob} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Data & Privacy ── */}
          {settingsTab === 'privacy' && (
            <>
              <h2 className={styles.pageTitle}>Data &amp; Privacy</h2>

              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Usage Data</h2>
                {[
                  { label: 'Share Usage Analytics', desc: 'Help improve LinkSphere by sharing anonymous usage data.', val: analyticsOpt, set: setAnalyticsOpt, key: 'ls-analytics' },
                  { label: 'Show Read Receipts', desc: 'Let others see when you have read their messages.', val: readReceipts, set: setReadReceipts, key: 'ls-receipts' },
                ].map(({ label, desc, val, set, key }) => (
                  <div key={key} className={styles.toggleRow} style={{ marginBottom: 20 }}>
                    <div>
                      <div className={styles.blockTitle}>{label}</div>
                      <div className={styles.blockDesc} style={{ marginBottom: 0 }}>{desc}</div>
                    </div>
                    <button className={`${styles.toggleBtn} ${val ? styles.toggleBtnOn : ''}`}
                      onClick={() => { const n = !val; set(n); localStorage.setItem(key, n); }}
                      aria-pressed={val}>
                      <div className={styles.toggleKnob} />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.sectionDivider} />

              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Clear Data</h2>
                <p className={styles.blockDesc}>Remove locally stored preferences and cached data. This does not delete your account or messages.</p>
                <button className={styles.dangerGhostBtn} onClick={() => {
                  const keys = ['ls-theme','ls-fontsize','ls-compact','ls-gifs','ls-embeds','ls-links','ls-emoji','ls-analytics','ls-receipts','ls-notif','ls-notifsnd','ls-mention','ls-motion','ls-contrast','ls-grouping','ls-echo','ls-noise','ls-ptt','ls-audioin','ls-audioout','ls-lang','ls-timefmt','ls-datefmt'];
                  keys.forEach(k => localStorage.removeItem(k));
                  setSuccessToast('Local data cleared. Refresh to apply defaults.');
                  setTimeout(() => setSuccessToast(''), 3000);
                }}>Clear Local Data</button>
              </div>
            </>
          )}

          {/* ── Notifications ── */}
          {settingsTab === 'notifications' && (
            <>
              <h2 className={styles.pageTitle}>Notifications</h2>

              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Desktop Notifications</h2>

                {notifPermission !== 'granted' && (
                  <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                    <p className={styles.blockDesc} style={{ marginBottom: 8 }}>Browser permission is required to show desktop notifications.</p>
                    <button className={styles.primaryBtn} onClick={async () => {
                      if (typeof Notification !== 'undefined') {
                        const perm = await Notification.requestPermission();
                        setNotifPermission(perm);
                      }
                    }}>Enable Desktop Notifications</button>
                  </div>
                )}
                {notifPermission === 'granted' && (
                  <div className={styles.settingsBadge} style={{ marginBottom: 16 }}>✅ Desktop notifications are enabled</div>
                )}

                {[
                  { label: 'Enable Notifications', desc: 'Receive notifications for new messages.', val: notifEnabled, set: setNotifEnabled, key: 'ls-notif' },
                  { label: 'Notification Sounds', desc: 'Play a sound when a notification arrives.', val: notifSound, set: setNotifSound, key: 'ls-notifsnd' },
                  { label: '@Mentions Only', desc: 'Only notify when you are directly mentioned.', val: notifMentionOnly, set: setNotifMentionOnly, key: 'ls-mention' },
                ].map(({ label, desc, val, set, key }) => (
                  <div key={key} className={styles.toggleRow} style={{ marginBottom: 20 }}>
                    <div>
                      <div className={styles.blockTitle}>{label}</div>
                      <div className={styles.blockDesc} style={{ marginBottom: 0 }}>{desc}</div>
                    </div>
                    <button className={`${styles.toggleBtn} ${val ? styles.toggleBtnOn : ''}`}
                      onClick={() => { const n = !val; set(n); localStorage.setItem(key, n); }}
                      aria-pressed={val}>
                      <div className={styles.toggleKnob} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Connections ── */}
          {settingsTab === 'connections' && (
            <>
              <h2 className={styles.pageTitle}>Connections</h2>
              <p className={styles.blockDesc} style={{ marginBottom: 24 }}>Manage the third-party accounts connected to your LinkSphere profile.</p>

              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                {/* Google */}
                <div className={styles.connectionCard}>
                  <div className={styles.connectionIcon} style={{ background: '#fff' }}>
                    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  </div>
                  <div className={styles.connectionInfo}>
                    <div className={styles.connectionName}>Google</div>
                    <div className={styles.connectionStatus}>{auth.user?.googleId ? `Connected as ${auth.user.email}` : 'Not connected'}</div>
                  </div>
                  <span className={`${styles.connectionBadge} ${auth.user?.googleId ? styles.connectionBadgeOn : styles.connectionBadgeOff}`}>
                    {auth.user?.googleId ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {/* GitHub */}
                <div className={styles.connectionCard}>
                  <div className={styles.connectionIcon} style={{ background: '#24292e' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  </div>
                  <div className={styles.connectionInfo}>
                    <div className={styles.connectionName}>GitHub</div>
                    <div className={styles.connectionStatus}>Not connected</div>
                  </div>
                  <span className={`${styles.connectionBadge} ${styles.connectionBadgeOff}`}>Disconnected</span>
                </div>

                {/* Discord */}
                <div className={styles.connectionCard}>
                  <div className={styles.connectionIcon} style={{ background: '#5865f2' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                  </div>
                  <div className={styles.connectionInfo}>
                    <div className={styles.connectionName}>Discord</div>
                    <div className={styles.connectionStatus}>Not connected</div>
                  </div>
                  <span className={`${styles.connectionBadge} ${styles.connectionBadgeOff}`}>Disconnected</span>
                </div>
              </div>
            </>
          )}

          {/* ── Accessibility ── */}
          {settingsTab === 'accessibility' && (
            <>
              <h2 className={styles.pageTitle}>Accessibility</h2>

              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Visual</h2>
                {[
                  { label: 'Reduce Motion', desc: 'Minimise animations and transitions throughout the app.', val: reduceMotion, set: setReduceMotion, key: 'ls-motion', apply: (v) => document.documentElement.dataset.motion = v ? 'reduced' : '' },
                  { label: 'High Contrast', desc: 'Increase contrast between text and background colours.', val: highContrast, set: setHighContrast, key: 'ls-contrast', apply: (v) => document.documentElement.dataset.contrast = v ? 'high' : '' },
                  { label: 'Group Messages', desc: 'Collapse consecutive messages from the same user.', val: msgGrouping, set: setMsgGrouping, key: 'ls-grouping', apply: () => {} },
                ].map(({ label, desc, val, set, key, apply }) => (
                  <div key={key} className={styles.toggleRow} style={{ marginBottom: 20 }}>
                    <div>
                      <div className={styles.blockTitle}>{label}</div>
                      <div className={styles.blockDesc} style={{ marginBottom: 0 }}>{desc}</div>
                    </div>
                    <button className={`${styles.toggleBtn} ${val ? styles.toggleBtnOn : ''}`}
                      onClick={() => { const n = !val; set(n); localStorage.setItem(key, n); apply(n); }}
                      aria-pressed={val}>
                      <div className={styles.toggleKnob} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Voice & Video ── */}
          {settingsTab === 'voice' && (
            <>
              <h2 className={styles.pageTitle}>Voice &amp; Video</h2>

              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Audio Devices</h2>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Input Device (Microphone)</label>
                  <select className={styles.selectField} value={selectedInput}
                    onChange={e => { setSelectedInput(e.target.value); localStorage.setItem('ls-audioin', e.target.value); }}
                    onClick={async () => {
                      if (audioDevices.inputs.length === 0) {
                        try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
                        const devs = await navigator.mediaDevices.enumerateDevices();
                        setAudioDevices({ inputs: devs.filter(d => d.kind === 'audioinput'), outputs: devs.filter(d => d.kind === 'audiooutput') });
                      }
                    }}>
                    <option value="">Default Microphone</option>
                    {audioDevices.inputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0,8)}`}</option>)}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Output Device (Speakers)</label>
                  <select className={styles.selectField} value={selectedOutput}
                    onChange={e => { setSelectedOutput(e.target.value); localStorage.setItem('ls-audioout', e.target.value); }}>
                    <option value="">Default Speaker</option>
                    {audioDevices.outputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0,8)}`}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.sectionDivider} />

              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Processing</h2>
                {[
                  { label: 'Echo Cancellation', desc: 'Reduce echo from your speaker being picked up by your microphone.', val: echoCancellation, set: setEchoCancellation, key: 'ls-echo' },
                  { label: 'Noise Suppression', desc: 'Filter out background noise during voice calls.', val: noiseSuppression, set: setNoiseSuppression, key: 'ls-noise' },
                ].map(({ label, desc, val, set, key }) => (
                  <div key={key} className={styles.toggleRow} style={{ marginBottom: 20 }}>
                    <div>
                      <div className={styles.blockTitle}>{label}</div>
                      <div className={styles.blockDesc} style={{ marginBottom: 0 }}>{desc}</div>
                    </div>
                    <button className={`${styles.toggleBtn} ${val ? styles.toggleBtnOn : ''}`}
                      onClick={() => { const n = !val; set(n); localStorage.setItem(key, n); }}
                      aria-pressed={val}>
                      <div className={styles.toggleKnob} />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.sectionDivider} />

              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Push-to-Talk</h2>
                <p className={styles.blockDesc}>Hold a key to activate your microphone during voice calls.</p>
                <div className={styles.pttDisplay}>
                  <span>{pttKey === 'None' ? 'No key bound' : `Key: ${pttKey}`}</span>
                  <button className={styles.editBtn} onClick={() => {
                    const handler = (e) => { e.preventDefault(); setPttKey(e.key === 'Escape' ? 'None' : e.key.toUpperCase()); localStorage.setItem('ls-ptt', e.key === 'Escape' ? 'None' : e.key.toUpperCase()); window.removeEventListener('keydown', handler); };
                    window.addEventListener('keydown', handler);
                    setPttKey('Press any key…');
                  }}>Set Key</button>
                </div>
              </div>
            </>
          )}

          {/* ── Language & Time ── */}
          {settingsTab === 'language' && (
            <>
              <h2 className={styles.pageTitle}>Language &amp; Time</h2>

              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Language</h2>
                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Display Language</label>
                  <select className={styles.selectField} value={language}
                    onChange={e => { setLanguage(e.target.value); localStorage.setItem('ls-lang', e.target.value); }}>
                    <option value="en">English (US)</option>
                    <option value="en-gb">English (UK)</option>
                    <option value="hi">Hindi — हिन्दी</option>
                    <option value="es">Spanish — Español</option>
                    <option value="fr">French — Français</option>
                    <option value="de">German — Deutsch</option>
                    <option value="ja">Japanese — 日本語</option>
                    <option value="zh">Chinese — 中文</option>
                    <option value="ko">Korean — 한국어</option>
                    <option value="ar">Arabic — العربية</option>
                  </select>
                </div>
              </div>

              <div className={styles.sectionDivider} />

              <div className={styles.sectionContainer} style={{ marginTop: 0 }}>
                <h2 className={styles.sectionTitle}>Time &amp; Date</h2>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Time Format</label>
                  <div className={styles.segmentedControl}>
                    {['12h', '24h'].map(f => (
                      <button key={f}
                        className={`${styles.segmentBtn} ${timeFormat === f ? styles.segmentBtnActive : ''}`}
                        onClick={() => { setTimeFormat(f); localStorage.setItem('ls-timefmt', f); }}>
                        {f === '12h' ? '12-hour (1:30 PM)' : '24-hour (13:30)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Date Format</label>
                  <div className={styles.segmentedControl}>
                    {[
                      { val: 'MDY', label: 'MM/DD/YYYY' },
                      { val: 'DMY', label: 'DD/MM/YYYY' },
                      { val: 'YMD', label: 'YYYY-MM-DD' },
                    ].map(({ val, label }) => (
                      <button key={val}
                        className={`${styles.segmentBtn} ${dateFormat === val ? styles.segmentBtnActive : ''}`}
                        onClick={() => { setDateFormat(val); localStorage.setItem('ls-datefmt', val); }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live preview */}
                <div className={styles.fontPreview} style={{ marginTop: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, marginRight: 8 }}>Preview:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {(() => {
                      const now = new Date();
                      const time = timeFormat === '12h'
                        ? now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })
                        : now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
                      const date = dateFormat === 'MDY'
                        ? `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`
                        : dateFormat === 'DMY'
                        ? `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`
                        : `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                      return `${date} at ${time}`;
                    })()}
                  </span>
                </div>
              </div>
            </>
          )}

        </div>{/* end contentWrapper */}

        <div className={styles.closeContainer} onClick={onClose}>
          <button className={styles.closeBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <span className={styles.escText}>ESC</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Delete Account</h3>
            <p className={styles.modalText} style={{ marginBottom: '20px' }}>
              Are you sure you want to delete your account? This action cannot be undone. Please enter your password to confirm.
            </p>
            <form onSubmit={handleDeleteAccount}>
              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>PASSWORD</label>
                <input
                  type="password"
                  className={styles.inputField}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {deleteError && <div className={styles.errorText}>{deleteError}</div>}
              <div className={styles.modalActions} style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className={styles.cancelLinkBtn}
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(""); setDeletePassword(""); }}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.confirmDeleteBtn}
                  disabled={isDeleting || !deletePassword}
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form Modal (Username / Email) */}
      {editMode && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              {editMode === 'username' ? 'Change your Username' : 'Enter an email address'}
            </h3>
            <p className={styles.modalText} style={{ marginBottom: '20px' }}>
              Enter a new {editMode} and your existing password.
            </p>
            <form onSubmit={handleUpdate}>
              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>{editMode.toUpperCase()}</label>
                <input
                  type={editMode === 'email' ? 'email' : 'text'}
                  className={styles.inputField}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>CURRENT PASSWORD</label>
                <input
                  type="password"
                  className={styles.inputField}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  required
                />
              </div>

              {editError && <div className={styles.errorText}>{editError}</div>}

              <div className={styles.modalActions} style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className={styles.cancelLinkBtn}
                  onClick={() => { setEditMode(null); setEditError(""); }}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.confirmEditBtn}
                  disabled={editLoading || !editValue || !editPassword}
                >
                  {editLoading ? "Saving..." : "Done"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Change your password</h3>
            <p className={styles.modalText} style={{ marginBottom: '20px' }}>
              Enter your current password and a new password.
            </p>
            <form onSubmit={handleChangePassword}>
              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>CURRENT PASSWORD</label>
                <input
                  type="password"
                  className={styles.inputField}
                  value={passwordCurrent}
                  onChange={(e) => setPasswordCurrent(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>NEW PASSWORD</label>
                <input
                  type="password"
                  className={styles.inputField}
                  value={passwordNew}
                  onChange={(e) => setPasswordNew(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>CONFIRM NEW PASSWORD</label>
                <input
                  type="password"
                  className={styles.inputField}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
              </div>

              {passwordError && <div className={styles.errorText}>{passwordError}</div>}

              <div className={styles.modalActions} style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className={styles.cancelLinkBtn}
                  onClick={() => { setShowPasswordModal(false); setPasswordError(""); setPasswordCurrent(""); setPasswordNew(""); setPasswordConfirm(""); }}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.confirmEditBtn}
                  disabled={passwordLoading || !passwordCurrent || !passwordNew || !passwordConfirm}
                >
                  {passwordLoading ? "Saving..." : "Done"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Password Modal (for Google OAuth users) */}
      {showAddPasswordModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Add a password</h3>
            <p className={styles.modalText} style={{ marginBottom: '20px' }}>
              Set a password for your account so you can use all features.
            </p>
            <form onSubmit={handleAddPassword}>
              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>NEW PASSWORD</label>
                <input
                  type="password"
                  className={styles.inputField}
                  value={addPwNew}
                  onChange={(e) => setAddPwNew(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>CONFIRM PASSWORD</label>
                <input
                  type="password"
                  className={styles.inputField}
                  value={addPwConfirm}
                  onChange={(e) => setAddPwConfirm(e.target.value)}
                  required
                />
              </div>

              {addPwError && <div className={styles.errorText}>{addPwError}</div>}

              <div className={styles.modalActions} style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className={styles.cancelLinkBtn}
                  onClick={() => { setShowAddPasswordModal(false); setAddPwError(""); setAddPwNew(""); setAddPwConfirm(""); }}
                  disabled={addPwLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.confirmEditBtn}
                  disabled={addPwLoading || !addPwNew || !addPwConfirm}
                >
                  {addPwLoading ? "Saving..." : "Set Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className={styles.successToast}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {successToast}
        </div>
      )}
    </div>
  );
}
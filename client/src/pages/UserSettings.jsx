import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './UserSettings.module.css';

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
            <NavItem label="My Account" active={true} />
            <NavItem label="Content & Social" />
            <NavItem label="Data & Privacy" />
            <NavItem label="Notifications" />
            <NavItem label="Connections" />
          </div>

          <div className={styles.divider} />

          <div className={styles.navSection}>
            <div className={styles.navHeader}>App Settings</div>
            <NavItem label="Appearance" />
            <NavItem label="Accessibility" />
            <NavItem label="Voice & Video" />
            <NavItem label="Language & Time" />
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
        </div>

        {/* Close Escape Button */}
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
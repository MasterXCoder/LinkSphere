import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserSettings.module.css';

export default function UserSettings({ onClose }) {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";
  const email = localStorage.getItem("email") || "user@example.com";

  // Mask email for display
  const [showEmail, setShowEmail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  const maskedEmail = currentEmail.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);

    try {
      // 1. Verify password via login endpoint (since there's no dedicated verify route)
      const cachedEmail = localStorage.getItem("email");
      const loginRes = await fetch("http://localhost:8000/api/users/login", {
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

      // Update the token in localStorage so the user doesn't get logged out randomly
      localStorage.setItem("token", newToken);

      // 2. Perform the update
      const userId = localStorage.getItem("userId");
      const body = {};
      if (editMode === 'username') body.username = editValue;
      if (editMode === 'email') body.email = editValue;

      const updateRes = await fetch(`http://localhost:8000/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${newToken}`
        },
        body: JSON.stringify(body)
      });

      if (updateRes.ok) {
        if (editMode === 'username') {
          localStorage.setItem("username", editValue);
          setCurrentUsername(editValue);
          setSuccessToast("Username successfully updated!");
        }
        if (editMode === 'email') {
          localStorage.setItem("email", editValue);
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
      const cachedEmail = localStorage.getItem("email");
      const loginRes = await fetch("http://localhost:8000/api/users/login", {
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
      localStorage.setItem("token", newToken);

      // 2. Perform the update with new password
      const userId = localStorage.getItem("userId");
      const updateRes = await fetch(`http://localhost:8000/api/users/${userId}`, {
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError("");
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    try {
      const res = await fetch(`http://localhost:8000/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
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
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
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
            <div className={styles.snippetAvatar}>
              {currentUsername.charAt(0).toUpperCase()}
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
              <div className={styles.cardAvatarWrapper} style={{ background: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>
                {currentUsername.charAt(0).toUpperCase()}
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
            <button className={styles.primaryBtn} onClick={() => { setShowPasswordModal(true); setPasswordError(""); }}>Change Password</button>
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
            <p className={styles.modalText}>
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            {deleteError && <div className={styles.errorText}>{deleteError}</div>}
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(""); }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
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
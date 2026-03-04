import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserSettings.module.css';

export default function UserSettings({ onClose }) {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";
  const email = localStorage.getItem("email") || "user@example.com";

  // Mask email for display
  const [showEmail, setShowEmail] = useState(false);
  const maskedEmail = email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

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
              {username.charAt(0).toUpperCase()}
            </div>
            <div className={styles.snippetInfo}>
              <div className={styles.snippetName}>{username}</div>
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
                {username.charAt(0).toUpperCase()}
              </div>

              <div className={styles.cardUserInfo}>
                <span className={styles.cardName}>{username}</span>
              </div>

              <button className={styles.editProfileBtn}>Edit User Profile</button>
            </div>

            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <div>
                  <div className={styles.infoLabel}>Display Name</div>
                  <div className={styles.infoValue}>{username}</div>
                </div>
                <button className={styles.editBtn}>Edit</button>
              </div>

              <div className={styles.infoRow}>
                <div>
                  <div className={styles.infoLabel}>Username</div>
                  <div className={styles.infoValue}>{username}</div>
                </div>
                <button className={styles.editBtn}>Edit</button>
              </div>

              <div className={styles.infoRow}>
                <div>
                  <div className={styles.infoLabel}>Email</div>
                  <div className={styles.infoValue}>
                    {showEmail ? email : maskedEmail}{' '}
                    <span className={styles.revealText} onClick={() => setShowEmail(!showEmail)} style={{ cursor: 'pointer' }}>
                      {showEmail ? 'Hide' : 'Reveal'}
                    </span>
                  </div>
                </div>
                <button className={styles.editBtn}>Edit</button>
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
            <button className={styles.primaryBtn}>Change Password</button>
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
              <button className={styles.dangerGhostBtn}>Delete Account</button>
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
    </div>
  );
}
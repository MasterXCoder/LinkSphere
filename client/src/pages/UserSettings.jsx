import React from 'react';
import styles from './UserSettings.module.css';

export default function UserSettings({ onClose }) {
  // Simple helper for rendering nav items
  const NavItem = ({ label, icon, active, badge, danger }) => (
    <div className={`${styles.navItem} ${active ? styles.activeNavItem : ''} ${danger ? styles.logoutItem : ''}`}>
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
               <svg width="20" height="15" viewBox="0 0 28 20" fill="currentColor"><path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461742 10.3368 0C8.48074 0.318797 6.68449 0.879656 4.97396 1.67671C1.56727 6.77853 0.645842 11.7538 1.11108 16.652C3.10102 18.1418 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.691C8.32996 17.3997 7.58522 17.0424 6.87684 16.6135C7.06531 16.4762 7.24726 16.3387 7.42442 16.1846C11.5911 18.1106 16.408 18.1106 20.5763 16.1846C20.7534 16.3387 20.9354 16.4762 21.1171 16.6135C20.41 17.0369 19.6639 17.3997 18.897 17.691C19.3052 18.4993 19.7718 19.2689 20.3021 20C22.6677 19.2743 24.8929 18.1418 26.8828 16.652C27.43 10.9731 25.9665 6.04728 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9828 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0072 8.34973 18.3161 8.34973C19.6249 8.34973 20.6751 9.54272 20.6543 10.994C20.6543 12.4453 19.6249 13.6383 18.3161 13.6383Z" /></svg>
            </div>
            <div className={styles.snippetInfo}>
              <div className={styles.snippetName}>
                Ishpreet Singh <span className={styles.newBadge}>NEW</span>
              </div>
              <div className={styles.editProfileLink}>
                Edit Profiles <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
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
            <NavItem label="Family Center" />
            <NavItem label="Authorized Apps" />
            <NavItem label="Devices" />
            <NavItem label="Connections" />
            <NavItem label="Notifications" />
          </div>

          <div className={styles.divider} />

          <div className={styles.navSection}>
            <div className={styles.navHeader}>Billing Settings</div>
            <NavItem label="Nitro" />
            <NavItem label="Server Boost" />
            <NavItem label="Subscriptions" />
          </div>

          <div className={styles.divider} />

          <div className={styles.navSection}>
            <div className={styles.navHeader}>App Settings</div>
            <NavItem label="Appearance" />
            <NavItem label="Accessibility" />
            <NavItem label="Voice & Video" />
            <NavItem label="Chat" />
            <NavItem label="Keybinds" />
            <NavItem label="Language & Time" />
            <NavItem label="Streamer Mode" />
            <NavItem label="Advanced" />
          </div>

          <div className={styles.divider} />

          <div className={styles.navSection}>
            <div className={styles.navHeader}>Activity Settings</div>
            <NavItem label="Activity Privacy" />
          </div>

          <div className={styles.divider} />

          <div className={styles.navSection}>
            <NavItem label="Log Out" danger={true} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>}/>
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
              <div className={styles.cardAvatarWrapper}>
                 <svg viewBox="0 0 28 20" fill="currentColor"><path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461742 10.3368 0C8.48074 0.318797 6.68449 0.879656 4.97396 1.67671C1.56727 6.77853 0.645842 11.7538 1.11108 16.652C3.10102 18.1418 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.691C8.32996 17.3997 7.58522 17.0424 6.87684 16.6135C7.06531 16.4762 7.24726 16.3387 7.42442 16.1846C11.5911 18.1106 16.408 18.1106 20.5763 16.1846C20.7534 16.3387 20.9354 16.4762 21.1171 16.6135C20.41 17.0369 19.6639 17.3997 18.897 17.691C19.3052 18.4993 19.7718 19.2689 20.3021 20C22.6677 19.2743 24.8929 18.1418 26.8828 16.652C27.43 10.9731 25.9665 6.04728 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9828 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0072 8.34973 18.3161 8.34973C19.6249 8.34973 20.6751 9.54272 20.6543 10.994C20.6543 12.4453 19.6249 13.6383 18.3161 13.6383Z" /></svg>
              </div>
              
              <div className={styles.cardUserInfo}>
                <span className={styles.cardName}>Ishpreet Singh</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b5bac1" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
              </div>

              <button className={styles.editProfileBtn}>Edit User Profile</button>
            </div>

            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <div>
                  <div className={styles.infoLabel}>Display Name</div>
                  <div className={styles.infoValue}>Ishpreet Singh</div>
                </div>
                <button className={styles.editBtn}>Edit</button>
              </div>
              
              <div className={styles.infoRow}>
                <div>
                  <div className={styles.infoLabel}>Username</div>
                  <div className={styles.infoValue}>ishpreetsingh0782</div>
                </div>
                <button className={styles.editBtn}>Edit</button>
              </div>

              <div className={styles.infoRow}>
                <div>
                  <div className={styles.infoLabel}>Email</div>
                  <div className={styles.infoValue}>*****************@gmail.com <span className={styles.revealText}>Reveal</span></div>
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

          {/* --- NEW PASSWORD AND AUTHENTICATION SECTION --- */}
          <div className={styles.sectionContainer}>
            <h2 className={styles.sectionTitle}>Password and Authentication</h2>
            <button className={styles.primaryBtn}>Change Password</button>

            <div className={styles.authBlock}>
              <h3 className={styles.blockTitle}>Authenticator App</h3>
              <p className={styles.blockDesc}>
                Protect your Discord account with an extra layer of security. Once configured, you'll be required to enter your password and complete one additional step in order to sign in.
              </p>
              <button className={styles.primaryBtn}>Enable Authenticator App</button>
            </div>

            <div className={styles.authBlock}>
              <h3 className={styles.blockTitle}>Security Keys</h3>
              <p className={styles.blockDesc}>
                Add an additional layer of protection to your account with a Security Key.
              </p>
              <button className={styles.primaryBtn}>Register a Security Key</button>
            </div>
          </div>

          <div className={styles.sectionDivider}></div>

          {/* --- NEW ACCOUNT REMOVAL SECTION --- */}
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
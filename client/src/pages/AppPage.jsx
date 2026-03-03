import React, { useState } from 'react'; 
import CreateServerModal from '../components/CreateServerModal'; 
import styles from "./AppPage.module.css";
import UserSettings from "./UserSettings";


const SERVERS = [
  { id: 1, name: "Ishpreet Singh's server", icon: "IS", acronym: "IS" },
  { id: 2, name: "Gaming", icon: "G", acronym: "G" },
];

const CHANNELS = {
  1: { text: ["general", "gen"], voice: ["General"] },
  2: { text: ["fps-games", "lfg"], voice: ["Lobby"] }
};

export default function AppPage() {
  // 'home' represents the Direct Messages/Friends view
  const [activeServer, setActiveServer] = useState("home"); 
  const [activeChannel, setActiveChannel] = useState("gen");
  const [isMuted, setIsMuted] = useState(true);
  const [friendInput, setFriendInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  const currentServer = SERVERS.find((s) => s.id === activeServer);
  const channels = CHANNELS[activeServer] || { text: [], voice: [] };

  // Helper component for the user info bar (reused in both sidebars)
  const UserInfoBar = () => (
    <footer className={styles.userInfo}>
      <div className={styles.userLeft}>
        <div className={styles.avatarWrapper}>
          <div className={styles.userAvatar}>
            <svg width="20" height="15" viewBox="0 0 28 20" fill="currentColor"><path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461742 10.3368 0C8.48074 0.318797 6.68449 0.879656 4.97396 1.67671C1.56727 6.77853 0.645842 11.7538 1.11108 16.652C3.10102 18.1418 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.691C8.32996 17.3997 7.58522 17.0424 6.87684 16.6135C7.06531 16.4762 7.24726 16.3387 7.42442 16.1846C11.5911 18.1106 16.408 18.1106 20.5763 16.1846C20.7534 16.3387 20.9354 16.4762 21.1171 16.6135C20.41 17.0369 19.6639 17.3997 18.897 17.691C19.3052 18.4993 19.7718 19.2689 20.3021 20C22.6677 19.2743 24.8929 18.1418 26.8828 16.652C27.43 10.9731 25.9665 6.04728 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9828 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0072 8.34973 18.3161 8.34973C19.6249 8.34973 20.6751 9.54272 20.6543 10.994C20.6543 12.4453 19.6249 13.6383 18.3161 13.6383Z" /></svg>
          </div>
          <div className={styles.statusIndicator}></div>
        </div>
        <div className={styles.userText}>
          <div className={styles.userName}>Ishpreet Singh</div>
          <div className={styles.userStatus}>Online</div>
        </div>
      </div>

      <div className={styles.userControls}>
        <button
          type="button"
          className={`${styles.userIconBtn} ${isMuted ? styles.userIconBtnDanger : ""}`}
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          )}
        </button>
        <button type="button" className={styles.userIconBtn} title="Deafen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
        </button>
        {/* Replace the User Settings button inside UserInfoBar with this: */}
        <button 
          type="button" 
          className={styles.userIconBtn} 
          title="User Settings"
          onClick={() => setShowSettings(true)} /* <-- ADD THIS ONCLICK */
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </div>
    </footer>
  );

  return (
    <div className={styles.layout}>
      {/* 1. FAR LEFT SERVER BAR */}
      <aside className={styles.serverSidebar}>
        <button
          type="button"
          className={`${styles.serverHome} ${activeServer === "home" ? styles.activeHome : ""}`}
          title="Direct Messages"
          onClick={() => setActiveServer("home")}
        >
          <svg width="28" height="20" viewBox="0 0 28 20" fill="currentColor">
            <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461742 10.3368 0C8.48074 0.318797 6.68449 0.879656 4.97396 1.67671C1.56727 6.77853 0.645842 11.7538 1.11108 16.652C3.10102 18.1418 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.691C8.32996 17.3997 7.58522 17.0424 6.87684 16.6135C7.06531 16.4762 7.24726 16.3387 7.42442 16.1846C11.5911 18.1106 16.408 18.1106 20.5763 16.1846C20.7534 16.3387 20.9354 16.4762 21.1171 16.6135C20.41 17.0369 19.6639 17.3997 18.897 17.691C19.3052 18.4993 19.7718 19.2689 20.3021 20C22.6677 19.2743 24.8929 18.1418 26.8828 16.652C27.43 10.9731 25.9665 6.04728 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9828 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0072 8.34973 18.3161 8.34973C19.6249 8.34973 20.6751 9.54272 20.6543 10.994C20.6543 12.4453 19.6249 13.6383 18.3161 13.6383Z" />
          </svg>
        </button>

        <div className={styles.divider} />

        {SERVERS.map((server) => (
          <button
            key={server.id}
            type="button"
            title={server.name}
            className={`${styles.serverIcon} ${
              activeServer === server.id ? styles.activeServer : ""
            }`}
            onClick={() => setActiveServer(server.id)}
          >
            {server.acronym}
          </button>
        ))}

        <button 
          type="button" 
          title="Add a Server" 
          className={styles.serverIcon} 
          style={{ background: "transparent", border: "1px dashed #35363c" }}
          onClick={() => setIsServerModalOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
      </aside>

      {/* 2. CONDITIONAL SECONDARY SIDEBAR */}
      <aside className={styles.secondarySidebar}>
        {activeServer === "home" ? (
          <>
            {/* Direct Messages Sidebar */}
            <div className={styles.searchWrapper}>
              <button className={styles.searchButton}>Find or start a conversation</button>
            </div>
            <div className={styles.scrollSection}>
              <div className={styles.dmNavList}>
                <div className={`${styles.navItem} ${styles.activeNavItem}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/></svg>
                  <span>Friends</span>
                </div>
                <div className={styles.navItem}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  <span>Nitro</span>
                </div>
                <div className={styles.navItem}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.29 2.83c-.15.19-.24.42-.24.67 0 .83.67 1.5 1.5 1.5h12M9 20a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"/></svg>
                  <span>Shop</span>
                  <span className={styles.newBadge}>NEW</span>
                </div>
                <div className={styles.navItem}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <span>Quests</span>
                </div>
              </div>

              <div className={styles.dmSectionHeader}>
                <span>Direct Messages</span>
                <button className={styles.addDmBtn}>+</button>
              </div>

              {/* Ghost DM Skeletons */}
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
            {/* Server Channels Sidebar */}
            <header className={styles.serverHeader}>
              <span>{currentServer?.name || "Server"}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </header>
            <section className={styles.scrollSection}>
              {/* Top Actions */}
              <div className={styles.topActions}>
                <div className={styles.actionItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <span>Events</span>
                </div>
              </div>
              
              <div className={styles.categoryHeader}>
                <span>Text Channels</span>
              </div>
              {channels.text.map((ch) => (
                <button
                  key={ch}
                  className={`${styles.channel} ${activeChannel === ch ? styles.activeChannel : ""}`}
                  onClick={() => setActiveChannel(ch)}
                >
                  <div className={styles.channelLeft}>
                    <span className={styles.hash}>#</span>
                    {ch}
                  </div>
                </button>
              ))}
            </section>
          </>
        )}
        <UserInfoBar />
      </aside>

      {/* 3. CONDITIONAL MAIN AREA */}
      <main className={styles.mainArea}>
        {activeServer === "home" ? (
          <>
            <header className={styles.topHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.headerTitle}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/></svg>
                  Friends
                </div>
                <div className={styles.headerDivider}></div>
                <div className={styles.headerTabs}>
                  <button className={styles.tabBtn}>Online</button>
                  <button className={styles.tabBtn}>All</button>
                  <button className={styles.tabBtn}>Pending</button>
                  <button className={styles.tabBtn}>Blocked</button>
                  <button className={`${styles.tabBtn} ${styles.activeTabBtn}`}>Add Friend</button>
                </div>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.iconBtn} title="New Group DM"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
                <button className={styles.iconBtn} title="Inbox"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></button>
                <button className={styles.iconBtn} title="Help"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></button>
              </div>
            </header>

            <div className={styles.friendsLayout}>
              <div className={styles.friendsMain}>
                <div className={styles.addFriendSection}>
                  <div className={styles.addFriendHeader}>
                    <div>
                      <h2 className={styles.addFriendTitle}>Add Friend</h2>
                      <p className={styles.addFriendDesc}>You can add friends with their Discord username.</p>
                    </div>
                  </div>
                  <div className={styles.addFriendInputBox}>
                    <input 
                      type="text" 
                      className={styles.friendInput}
                      placeholder="You can add friends with their Discord username."
                      value={friendInput}
                      onChange={(e) => setFriendInput(e.target.value)}
                    />
                    <button className={`${styles.sendRequestBtn} ${friendInput ? styles.active : ""}`}>
                      Send Friend Request
                    </button>
                  </div>
                </div>

                <div className={styles.otherPlaces}>
                  <h2 className={styles.addFriendTitle}>Other Places to Make Friends</h2>
                  <p className={styles.addFriendDesc}>Don't have a username on hand? Check out our list of public servers that includes everything from gaming to cooking, music, anime and more.</p>
                  
                  <div className={styles.discoverBtn}>
                    <div className={styles.discoverLeft}>
                      <div className={styles.discoverIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm-2.73-6.65L16.5 8.5 9.68 15.35c.16.24.41.49.65.65h-1.06zM8.5 16.5l6.85-7.18c-.24-.16-.49-.41-.65-.65L7.82 15.44z"/></svg>
                      </div>
                      <span>Explore Discoverable Servers</span>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                </div>
              </div>

              {/* Active Now Sidebar */}
              <aside className={styles.activeNow}>
                <h3 className={styles.activeNowTitle}>Active Now</h3>
                <div className={styles.emptyActiveCard}>
                  <h4 className={styles.emptyActiveTitle}>It's quiet for now...</h4>
                  <p className={styles.emptyActiveText}>When a friend starts an activity—like playing a game or hanging out on voice—we'll show it here!</p>
                </div>
              </aside>
            </div>
          </>
        ) : (
          <>
            <header className={styles.topHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.hash} style={{marginRight: 8}}>#</span>
                <span className={styles.headerTitle}>{activeChannel}</span>
              </div>
            </header>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#949ba4' }}>
              No messages yet.
            </div>
          </>
        )}
      </main>
      {showSettings && <UserSettings onClose={() => setShowSettings(false)} />}
        {isServerModalOpen && <CreateServerModal onClose={() => setIsServerModalOpen(false)} />}
    </div>
  );
}
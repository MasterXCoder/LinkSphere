import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AppPage.module.css";

const SERVERS = [
  { id: 1, name: "General", icon: "G" },
  { id: 2, name: "Gaming", icon: "🎮" },
  { id: 3, name: "Dev Hub", icon: "⚙" },
  { id: 4, name: "Music", icon: "♪" },
];

const CHANNELS = {
  1: ["general", "random", "announcements"],
  2: ["fps-games", "rpgs", "looking-for-group"],
  3: ["code-help", "projects", "resources"],
  4: ["now-playing", "recommendations", "playlists"],
};

const MESSAGES = {
  general: [
    { id: 1, user: "alice", text: "Hey everyone! 👋", time: "Today at 10:32 AM" },
    { id: 2, user: "bob", text: "What's up! Just joined this server.", time: "Today at 10:35 AM" },
    { id: 3, user: "carol", text: "Welcome Bob! Feel free to explore the channels.", time: "Today at 10:36 AM" },
  ],
  random: [
    { id: 1, user: "dave", text: "Anyone up for a game tonight?", time: "Today at 9:00 AM" },
    { id: 2, user: "eve", text: "I'm in! Which game?", time: "Today at 9:02 AM" },
  ],
};

export default function AppPage() {
  const [activeServer, setActiveServer] = useState(1);
  const [activeChannel, setActiveChannel] = useState("general");
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState(MESSAGES);
  const navigate = useNavigate();

  const channels = CHANNELS[activeServer] || [];
  const messages = chatMessages[activeChannel] || [];

  const sendMessage = () => {
    if (!message.trim()) return;
    const newMsg = {
      id: Date.now(),
      user: "you",
      text: message,
      time: "Just now",
    };
    setChatMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg],
    }));
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className={styles.layout}>
      {/* Server sidebar */}
      <div className={styles.serverSidebar}>
        <div className={styles.serverHome} title="Home">◈</div>
        <div className={styles.divider} />
        {SERVERS.map(s => (
          <div
            key={s.id}
            className={`${styles.serverIcon} ${activeServer === s.id ? styles.activeServer : ""}`}
            title={s.name}
            onClick={() => { setActiveServer(s.id); setActiveChannel(CHANNELS[s.id][0]); }}
          >
            {s.icon}
          </div>
        ))}
        <div className={styles.divider} />
        <div
          className={styles.serverIcon}
          title="Logout"
          style={{ marginTop: "auto", color: "var(--danger)", fontSize: "1.2rem" }}
          onClick={() => navigate("/")}
        >
          ⏻
        </div>
      </div>

      {/* Channel sidebar */}
      <div className={styles.channelSidebar}>
        <div className={styles.serverName}>{SERVERS.find(s => s.id === activeServer)?.name}</div>
        <div className={styles.channelSection}>
          <p className={styles.channelLabel}>Text Channels</p>
          {channels.map(ch => (
            <div
              key={ch}
              className={`${styles.channel} ${activeChannel === ch ? styles.activeChannel : ""}`}
              onClick={() => setActiveChannel(ch)}
            >
              <span className={styles.hash}>#</span>{ch}
            </div>
          ))}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>Y</div>
          <div>
            <div className={styles.userName}>you</div>
            <div className={styles.userStatus}>● Online</div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className={styles.main}>
        <div className={styles.chatHeader}>
          <span className={styles.hash} style={{ fontSize: "1.1rem" }}>#</span>
          <span className={styles.chatTitle}>{activeChannel}</span>
        </div>

        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.empty}>No messages yet. Say something!</div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={styles.message}>
              <div className={styles.msgAvatar}>{msg.user[0].toUpperCase()}</div>
              <div>
                <div className={styles.msgMeta}>
                  <span className={styles.msgUser}>{msg.user}</span>
                  <span className={styles.msgTime}>{msg.time}</span>
                </div>
                <div className={styles.msgText}>{msg.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.inputBar}>
          <input
            className={styles.chatInput}
            placeholder={`Message #${activeChannel}`}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className={styles.sendBtn} onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}
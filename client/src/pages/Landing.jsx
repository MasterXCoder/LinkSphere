import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import styles from "./Landing.module.css";

const COLLABORATORS = [
  { handle: "MasterXCoder", name: "Vanshdeep Singh Dhot", initials: "VS" },
  { handle: "ishpreet-02", name: "Ishpreet Singh Bhatia", initials: "IS" },
  { handle: "madhavv-xd", name: "Madhav", initials: "MA" },
  { handle: "Mohit-jpg-dot", name: "Mohit", initials: "MO" },
];

const FEATURES = [
  {
    title: "Create servers & channels",
    desc: "Set up your own space with text and voice channels. Organize conversations by topic, project, or just vibes. Everything in one place.",
    gradient: "purple",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={styles.featureIcon}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Chat in real time",
    desc: "Send messages instantly with live updates. No refresh needed. Express yourself with text, links, and more — conversations flow naturally.",
    gradient: "pink",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={styles.featureIcon}>
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Connect with your community",
    desc: "See who's online, jump into conversations, and build meaningful connections. Your community is always just a click away.",
    gradient: "green",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={styles.featureIcon}>
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Built for everyone",
    desc: "Whether you're a small study group or a large community, LinkSphere scales with you. Manage roles, permissions, and keep things organized.",
    gradient: "blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={styles.featureIcon}>
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor" />
      </svg>
    ),
  },
];

export default function Landing() {
  return (
    <div className={styles.page}>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.starField}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className={styles.star} style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
            }} />
          ))}
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.heading}>
            Group Chat<br />That's All<br />Fun & Games
          </h1>
          <p className={styles.sub}>
            LinkSphere is great for playing games and chilling with friends,
            or even building a worldwide community. Customize your own space
            to talk, play, and hang out.
          </p>
          <div className={styles.actions}>
            <Link to="/signup" className={styles.primaryBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
              </svg>
              Get Started Free
            </Link>
            <Link to="/login" className={styles.secondaryBtn}>
              Open LinkSphere in Browser
            </Link>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.mockupWindow}>
            <div className={styles.mockupBar}>
              <span className={styles.dot} style={{ background: '#ed6a5e' }} />
              <span className={styles.dot} style={{ background: '#f5bf4f' }} />
              <span className={styles.dot} style={{ background: '#61c554' }} />
            </div>
            <div className={styles.mockupBody}>
              <div className={styles.mockupSidebar}>
                <div className={styles.serverIcon} style={{ background: '#5865f2' }}>LS</div>
                <div className={styles.serverIcon} style={{ background: '#3ba55d' }}>🎮</div>
                <div className={styles.serverIcon} style={{ background: '#ed4245' }}>🎵</div>
                <div className={styles.serverIcon} style={{ background: '#faa61a' }}>📚</div>
              </div>
              <div className={styles.mockupChannels}>
                <div className={styles.channelHeader}>LinkSphere</div>
                <div className={styles.channelItem}><span className={styles.hash}>#</span> general</div>
                <div className={`${styles.channelItem} ${styles.activeChannel}`}><span className={styles.hash}>#</span> gaming</div>
                <div className={styles.channelItem}><span className={styles.hash}>#</span> music</div>
                <div className={styles.channelItem}><span className={styles.voiceIcon}>🔊</span> Voice Lounge</div>
              </div>
              
              <div className={styles.mockupChat}>
                <div className={styles.chatMsg}>
                  <span className={styles.msgAvatar} style={{ background: '#5865f2' }}>V</span>
                  <div>
                    <span className={styles.msgName} style={{ color: '#5865f2' }}>Vansh</span>
                    <span className={styles.msgTime}>Today at 2:30 PM</span>
                    <p className={styles.msgText}>Hey everyone! Welcome to LinkSphere 🚀</p>
                  </div>
                </div>

                <div className={styles.chatMsg}>
                  <span className={styles.msgAvatar} style={{ background: '#3ba55d' }}>I</span>
                  <div>
                    <span className={styles.msgName} style={{ color: '#3ba55d' }}>Ishpreet</span>
                    <span className={styles.msgTime}>Today at 2:31 PM</span>
                    <p className={styles.msgText}>This looks amazing! Let's go 🎉</p>
                  </div>
                </div>

                <div className={styles.chatMsg}>
                  <span className={styles.msgAvatar} style={{ background: '#faa61a' }}>M</span>
                  <div>
                    <span className={styles.msgName} style={{ color: '#faa61a' }}>Madhav</span>
                    <span className={styles.msgTime}>Today at 2:32 PM</span>
                    <p className={styles.msgText}>Time to build something epic 💪</p>
                  </div>
                </div>

                <div className={styles.chatMsg}>
                  <span className={styles.msgAvatar} style={{ background: '#f258e8' }}>M</span>
                  <div>
                    <span className={styles.msgName} style={{ color: '#ef58f2' }}>Mohit</span>
                    <span className={styles.msgTime}>Today at 2:40 PM</span>
                    <p className={styles.msgText}>Cool, lets add that feature.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      {FEATURES.map((f, i) => (
        <section
          key={i}
          className={`${styles.featureSection} ${styles[f.gradient]}`}
          style={{ flexDirection: i % 2 === 0 ? "row" : "row-reverse" }}
        >
          <div className={styles.featureCard}>
            <div className={styles.featureCardIcon}>{f.icon}</div>
            <div className={styles.featureCardMock}>
              {f.gradient === "purple" && (
                <div className={styles.miniServer}>
                  <div className={styles.miniServerHeader}><span className={styles.miniHash}>#</span><span>general</span></div>
                  <div className={styles.miniChannelList}>
                    <div className={styles.miniChannel}># announcements</div>
                    <div className={styles.miniChannel}># welcome</div>
                    <div className={`${styles.miniChannel} ${styles.miniActive}`}># general</div>
                    <div className={styles.miniChannel}>🔊 Voice Chat</div>
                  </div>
                </div>
              )}
              {f.gradient === "pink" && (
                <div className={styles.miniChat}>
                  <div className={styles.miniChatBubble}>
                    <span className={styles.miniAvatar} style={{ background: '#5865f2' }}>M</span>
                    <div className={styles.miniBubbleContent}><span className={styles.miniBubbleName}>Mohit</span><span>Anyone up for a game? 🎮</span></div>
                  </div>
                  <div className={styles.miniChatBubble}>
                    <span className={styles.miniAvatar} style={{ background: '#3ba55d' }}>I</span>
                    <div className={styles.miniBubbleContent}><span className={styles.miniBubbleName}>Ishpreet</span><span>Count me in! 🙌</span></div>
                  </div>
                  <div className={styles.miniTyping}>
                    <span className={styles.typingDot} /><span className={styles.typingDot} /><span className={styles.typingDot} />
                    <span className={styles.typingLabel}>Vansh is typing...</span>
                  </div>
                </div>
              )}
              {f.gradient === "green" && (
                <div className={styles.miniOnline}>
                  <div className={styles.miniOnlineHeader}>ONLINE — 3</div>
                  <div className={styles.miniUser}><span className={styles.miniUserDot} style={{ background: '#3ba55d' }} /><span>Vansh</span><span className={styles.miniActivity}>Playing VSCode</span></div>
                  <div className={styles.miniUser}><span className={styles.miniUserDot} style={{ background: '#3ba55d' }} /><span>Ishpreet</span><span className={styles.miniActivity}>Listening to Spotify</span></div>
                  <div className={styles.miniUser}><span className={styles.miniUserDot} style={{ background: '#faa61a' }} /><span>Madhav</span><span className={styles.miniActivity}>Idle</span></div>
                </div>
              )}
              {f.gradient === "blue" && (
                <div className={styles.miniRoles}>
                  <div className={styles.miniRolesHeader}>Roles & Permissions</div>
                  <div className={styles.miniRole}><span className={styles.miniRoleDot} style={{ background: '#ed4245' }} />Admin</div>
                  <div className={styles.miniRole}><span className={styles.miniRoleDot} style={{ background: '#5865f2' }} />Moderator</div>
                  <div className={styles.miniRole}><span className={styles.miniRoleDot} style={{ background: '#3ba55d' }} />Member</div>
                  <div className={styles.miniRole}><span className={styles.miniRoleDot} style={{ background: '#faa61a' }} />Guest</div>
                </div>
              )}
            </div>
          </div>
          <div className={styles.featureText}>
            <h2 className={styles.featureTitle}>{f.title}</h2>
            <p className={styles.featureDesc}>{f.desc}</p>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaStars}>
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className={styles.star} style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
            }} />
          ))}
        </div>
        <h2 className={styles.ctaHeading}>Ready to start your journey?</h2>
        <p className={styles.ctaSub}>Join LinkSphere today and bring your community together.</p>
        <Link to="/signup" className={styles.ctaButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
          </svg>
          Get Started — It's Free
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}><Logo size={20} light /></span>
            <p className={styles.footerTagline}>Real-time communication platform for communities, gamers, and friends.</p>
            <div className={styles.socialLinks}>
              <a href="https://github.com/MasterXCoder/LinkSphere" target="_blank" rel="noreferrer" aria-label="GitHub">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 002 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" /></svg>
              </a>
            </div>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.footerColHeading}>Product</h4>
            <ul className={styles.footerLinks}>
              <li><Link to="/signup">Sign Up</Link></li>
              <li><Link to="/login">Log In</Link></li>
              <li><a href="https://github.com/MasterXCoder/LinkSphere" target="_blank" rel="noreferrer">GitHub</a></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.footerColHeading}>Contact</h4>
            <ul className={styles.footerLinks}>
              <li><a href="mailto:linkspherexco@gmail.com">linkspherexco@gmail.com</a></li>
              <li><span> Patiala, Punjab, India</span></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.footerColHeading}>Contributors</h4>
            <ul className={styles.footerLinks}>
              {COLLABORATORS.map((c) => (
                <li key={c.handle}>
                  <a href={`https://github.com/${c.handle}`} target="_blank" rel="noreferrer" className={styles.contributorLink}>
                    <span className={styles.contributorAvatar}>{c.initials}</span>
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Giant wordmark */}
        <div className={styles.footerWordmark}>Linksphere</div>
        <div className={styles.footerBottom}>
          <p>© 2025 LinkSphere · Built with Node.js &amp; React</p>
        </div>
      </footer>
    </div>
  );
}
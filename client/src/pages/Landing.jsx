import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import styles from "./Landing.module.css";

const COLLABORATORS = [
  { handle: "MasterXCoder",  name: "Vanshdeep Singh Dhot",   initials: "VS" },
  { handle: "ishpreet-02",   name: "Ishpreet Singh Bhatia",  initials: "IS" },
  { handle: "madhavv-xd",    name: "Madhav",                 initials: "MA" },
  { handle: "Mohit-jpg-dot", name: "Mohit",                  initials: "MO" },
];

export default function Landing() {
  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── Hero ── */}
      <main className={styles.hero}>
        <div className={styles.glow} />
        <span className={styles.badge}>Real-time Communication Platform</span>
        <h1 className={styles.heading}>
          Where Communities<br />Come Alive
        </h1>
        <p className={styles.sub}>
          Create servers, manage channels, and connect instantly.<br />
          LinkSphere brings your community together.
        </p>
        <div className={styles.actions}>
          <Link to="/signup" className={styles.primary}>Get Started Free</Link>
          <Link to="/login"  className={styles.secondary}>Log In</Link>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>

          {/* Col 1 – Brand */}
          <div className={styles.col}>
            <span className={styles.footerLogo}>◈ LinkSphere</span>
            <p className={styles.footerTagline}>Real-time communication platform</p>
            <p className={styles.footerTagline}>
              A full-stack chat app built as a learning project — featuring servers, channels, and live messaging.
            </p>
          </div>

          {/* Col 2 – Contact */}
          <div className={styles.col}>
            <h4 className={styles.colHeading}>Contact Us</h4>
            <ul className={styles.contactList}>
              <li>
                <span className={styles.icon}>✉</span>
                <a href="mailto:vanshdhot2544@gmail.com">vanshdhot2544@gmail.com</a>
              </li>
              <li>
                <span className={styles.icon}>📍</span>
                Patiala, Punjab, India
              </li>
              <li>
                <span className={styles.icon}>🐙</span>
                <a href="https://github.com/MasterXCoder/LinkSphere" target="_blank" rel="noreferrer">
                  github.com/MasterXCoder/LinkSphere
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3 – Contributors */}
          <div className={styles.col}>
            <h4 className={styles.colHeading}>Contributors</h4>
            <ul className={styles.collabList}>
              {COLLABORATORS.map((c) => (
                <li key={c.handle}>
                  <a
                    href={`https://github.com/${c.handle}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.collabRow}
                  >
                    <span className={styles.avatar}>{c.initials}</span>
                    <span className={styles.collabText}>
                      <span className={styles.collabName}>{c.name}</span>
                      <span className={styles.collabHandle}>@{c.handle}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className={styles.footerBottom}>
          <p>© 2025 LinkSphere · Built with Node.js &amp; React</p>
        </div>
      </footer>
    </div>
  );
}
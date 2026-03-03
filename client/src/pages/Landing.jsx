import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import styles from "./Landing.module.css";

export default function Landing() {
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.hero}>
        <div className={styles.glow} />
        <p className={styles.badge}>Real-time Communication Platform</p>
        <h1 className={styles.heading}>
          Where Communities<br />Come Alive
        </h1>
        <p className={styles.sub}>
          Create servers, manage channels, and connect instantly.<br />
          LinkSphere brings your community together.
        </p>
        <div className={styles.actions}>
          <Link to="/signup" className={styles.primary}>Get Started Free</Link>
          <Link to="/login" className={styles.secondary}>Log In</Link>
        </div>
      </main>
    </div>
  );
}
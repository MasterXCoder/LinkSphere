import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoIcon}>◈</span>
        <span className={styles.logoText}>LinkSphere</span>
      </Link>
      <div className={styles.links}>
        <Link to="/login" className={styles.loginBtn}>Log In</Link>
        <Link to="/signup" className={styles.signupBtn}>Sign Up</Link>
      </div>
    </nav>
  );
}
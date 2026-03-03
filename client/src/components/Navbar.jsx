import { Link, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const location = useLocation();
  const isAuth = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoIcon}>◈</span>
        <span className={styles.logoText}>LinkSphere</span>
      </Link>

      <div className={styles.links}>
        {!isAuth && (
          <>
            <Link to="/login" className={styles.loginBtn}>
              Log In
            </Link>
            <Link to="/signup" className={styles.signupBtn}>
              Sign Up
            </Link>
          </>
        )}
        {isAuth && (
          <Link to="/" className={styles.loginBtn}>
            Back to home
          </Link>
        )}
      </div>
    </nav>
  );
}
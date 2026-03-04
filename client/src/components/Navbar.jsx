import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const location = useLocation();
  const isAuth = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        <Logo size={22} />
      </Link>

      <div className={styles.links}>
        {isAuth ? (
          <Link to="/" className={styles.loginBtn}>
            Back to home
          </Link>
        ) : localStorage.getItem("token") ? (
          <Link to="/app" className={styles.signupBtn}>
            Enter the Sphere →
          </Link>
        ) : (
          <>
            <Link to="/login" className={styles.loginBtn}>
              Log In
            </Link>
            <Link to="/signup" className={styles.signupBtn}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
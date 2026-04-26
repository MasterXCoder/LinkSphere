import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const token = searchParams.get("token");
    const userParam = searchParams.get("user");

    if (!token || !userParam) {
      setError("Authentication failed. Missing credentials.");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      login({ token, user });
      navigate("/app", { replace: true });
    } catch (err) {
      console.error("OAuth callback error:", err);
      setError("Authentication failed. Please try again.");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    }
  }, [searchParams, navigate, login]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#313338",
      color: "#f2f3f5",
      fontFamily: "'Outfit', 'Noto Sans', sans-serif",
      gap: "1rem",
    }}>
      {error ? (
        <p style={{ color: "#f38688" }}>{error}</p>
      ) : (
        <>
          <div style={{
            width: "32px",
            height: "32px",
            border: "3px solid rgba(88, 101, 242, 0.3)",
            borderTopColor: "#5865f2",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }} />
          <p style={{ fontSize: "1.1rem", opacity: 0.8 }}>Signing you in...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}

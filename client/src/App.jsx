import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import OAuthCallback from "./pages/OAuthCallback";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import App from "./pages/AppPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { API } from "./apiConfig";
import "./index.css";

/**
 * GuestRoute – if the user already has a token, redirect to /app
 */
function GuestRoute({ children }) {
  const { token } = useAuth();
  if (token) {
    return <Navigate to="/app" replace />;
  }
  return children;
}

/**
 * InvitePage – handles /invite/:code
 * If logged in → auto-join the server and redirect to /app
 * If not logged in → redirect to /login, then they can paste the link in the Join modal
 */
function InvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [status, setStatus] = useState("Joining server...");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const joinServer = async () => {
      try {
        const res = await fetch(`${API}/servers/invite/${code}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          navigate("/app", { replace: true });
        } else {
          setStatus(data.error || "Failed to join server");
        }
      } catch (err) {
        setStatus("Could not connect to server");
      }
    };

    joinServer();
  }, [code, token, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#313338',
      color: '#f2f3f5',
      fontFamily: "'Outfit', 'Noto Sans', sans-serif",
      fontSize: '1.2rem',
    }}>
      {status}
    </div>
  );
}

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={
          <GuestRoute><Login /></GuestRoute>
        } />
        <Route path="/signup" element={
          <GuestRoute><Signup /></GuestRoute>
        } />
        <Route path="/app" element={
          <ProtectedRoute><App /></ProtectedRoute>
        } />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/invite/:code" element={<InvitePage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
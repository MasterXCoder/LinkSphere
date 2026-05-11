import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthForm from "../components/AuthForm";

const LOGIN_FIELDS = [
  { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
  { name: "password", label: "Password", type: "password", placeholder: "Your password" },
];

import { API } from '../apiConfig';

export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (data) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok) {
        auth.login({ token: json.token, user: json.user });
        navigate("/app");
      } else {
        setError(json.error || "Login failed. Check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Log in to your LinkSphere account"
      fields={LOGIN_FIELDS}
      submitLabel="Log In"
      onSubmit={handleLogin}
      footerText="Don't have an account?"
      footerLink="/signup"
      footerLinkText="Sign up"
      error={error}
      loading={loading}
    />
  );
}

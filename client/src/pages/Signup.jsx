import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";

const SIGNUP_FIELDS = [
  { name: "username", label: "Username", type: "text", placeholder: "Choose a username" },
  { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
  { name: "password", label: "Password", type: "password", placeholder: "Create a password" },
];

export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (data) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok) {
        navigate("/login");
      } else {
        setError(json.error || "Signup failed. Please try again.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Create account"
      subtitle="Join LinkSphere and start connecting"
      fields={SIGNUP_FIELDS}
      submitLabel="Create Account"
      onSubmit={handleSignup}
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Log in"
      error={error}
      loading={loading}
    />
  );
}
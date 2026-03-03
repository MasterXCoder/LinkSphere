import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";

const SIGNUP_FIELDS = [
  { name: "username", label: "Username", type: "text", placeholder: "Choose a username" },
  { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
  { name: "password", label: "Password", type: "password", placeholder: "Create a password" },
];

export default function Signup() {
  const navigate = useNavigate();

  const handleSignup = async (data) => {
    try {
      const res = await fetch("http://localhost:3000/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        navigate("/app");
      } else {
        alert("Signup failed. Please try again.");
      }
    } catch {
      // Dev mode: navigate anyway if server not running
      navigate("/app");
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
    />
  );
}
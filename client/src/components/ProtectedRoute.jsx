import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute – wraps any route that requires authentication.
 * If no JWT token exists in localStorage, the user is redirected
 * to the landing page ("/").
 */
export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/" replace />;
    }

    return children;
}

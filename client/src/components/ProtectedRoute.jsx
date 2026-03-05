import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute – wraps any route that requires authentication.
 * If no JWT token exists, the user is redirected to the landing page ("/").
 */
export default function ProtectedRoute({ children }) {
    const { token } = useAuth();

    if (!token) {
        return <Navigate to="/" replace />;
    }

    return children;
}


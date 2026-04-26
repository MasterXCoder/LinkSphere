import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        return {
            id: Number(localStorage.getItem("userId")),
            username: localStorage.getItem("username") || "User",
            email: localStorage.getItem("email") || "",
            dob: localStorage.getItem("dob") || "",
            hasPassword: localStorage.getItem("hasPassword") !== "false",
        };
    });

    const [token, setToken] = useState(() => localStorage.getItem("token"));

    const login = useCallback(({ token: newToken, user: userData }) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("userId", userData.id);
        localStorage.setItem("username", userData.username);
        localStorage.setItem("email", userData.email);
        localStorage.setItem("dob", userData.dob);
        localStorage.setItem("hasPassword", userData.hasPassword === false ? "false" : "true");

        setToken(newToken);
        setUser({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            dob: userData.dob,
            hasPassword: userData.hasPassword !== false,
        });
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        localStorage.removeItem("dob");
        localStorage.removeItem("hasPassword");

        setToken(null);
        setUser(null);
    }, []);

    const updateUser = useCallback((fields) => {
        setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, ...fields };

            if (fields.username) localStorage.setItem("username", fields.username);
            if (fields.email) localStorage.setItem("email", fields.email);
            if (fields.dob) localStorage.setItem("dob", fields.dob);
            if (fields.hasPassword !== undefined) localStorage.setItem("hasPassword", String(fields.hasPassword));

            return updated;
        });
    }, []);

    const updateToken = useCallback((newToken) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, updateToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
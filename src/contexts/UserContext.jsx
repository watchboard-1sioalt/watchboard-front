import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = "http://localhost/api";

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("jwt_token"));
    const [loading, setLoading] = useState(!!localStorage.getItem("jwt_token"));

    const saveToken = (t) => {
        localStorage.setItem("jwt_token", t);
        setToken(t);
    };

    const clearToken = () => {
        localStorage.removeItem("jwt_token");
        setToken(null);
        setUser(null);
    };

    const fetchMe = useCallback(async (t) => {
        try {
            const res = await fetch(`${API}/auth/me`, {
                headers: { Authorization: `Bearer ${t}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setUser(data);
        } catch {
            clearToken();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (token) fetchMe(token);
    }, []);

    const login = async (email, password) => {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erreur de connexion");

        saveToken(data.access_token);
        await fetchMe(data.access_token);
    };

    const logout = async () => {
        if (token) {
            await fetch(`${API}/auth/logout`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => { });
        }
        clearToken();
    };

    return (
        <UserContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}

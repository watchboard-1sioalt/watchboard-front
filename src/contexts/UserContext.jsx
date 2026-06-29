import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const API = "http://localhost/api";

const UserContext = createContext(null);

function getTokenExpiry(t) {
    try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        return payload.exp ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("jwt_token"));
    const [loading, setLoading] = useState(!!localStorage.getItem("jwt_token"));
    const refreshTimerRef = useRef(null);

    const clearRefreshTimer = () => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    };

    const saveToken = useCallback((t) => {
        localStorage.setItem("jwt_token", t);
        setToken(t);
    }, []);

    const clearToken = useCallback(() => {
        clearRefreshTimer();
        localStorage.removeItem("jwt_token");
        setToken(null);
        setUser(null);
    }, []);

    const scheduleRefresh = useCallback((t) => {
        clearRefreshTimer();
        const expiry = getTokenExpiry(t);
        if (!expiry) return;

        // Rafraîchit 60 secondes avant expiration
        const delay = expiry - Date.now() - 60_000;
        if (delay <= 0) return;

        refreshTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`${API}/auth/refresh`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${t}` },
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                const newToken = data.access_token;
                saveToken(newToken);
                scheduleRefresh(newToken);
            } catch {
                clearToken();
            }
        }, delay);
    }, [saveToken, clearToken]);

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
    }, [clearToken]);

    useEffect(() => {
        if (token) {
            fetchMe(token);
            scheduleRefresh(token);
        }
        return () => clearRefreshTimer();
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
        scheduleRefresh(data.access_token);
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

"use client";
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  mobile?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Read auth synchronously so first render already has user — no flash
function readAuth(): { user: User | null; accessToken: string | null } {
  if (typeof window === "undefined") return { user: null, accessToken: null };
  try {
    const stored = localStorage.getItem("auth");
    if (!stored) return { user: null, accessToken: null };
    return JSON.parse(stored);
  } catch {
    return { user: null, accessToken: null };
  }
}

function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (payload.exp || 0) * 1000;
  } catch {
    return 0;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readAuth();
  const [user, setUser] = useState<User | null>(initial.user);
  const [accessToken, setAccessToken] = useState<string | null>(initial.accessToken);
  const [loading, setLoading] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("auth");
    window.location.href = "/login";
  };

  const scheduleRefresh = (token: string) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const expiry = getTokenExpiry(token);
    if (!expiry) return;
    // Refresh 2 minutes before expiry
    const delay = expiry - Date.now() - 2 * 60 * 1000;
    if (delay <= 0) {
      silentRefresh();
      return;
    }
    refreshTimer.current = setTimeout(silentRefresh, delay);
  };

  const silentRefresh = async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (!res.ok) { logout(); return; }
      const data = await res.json();
      if (!data.accessToken) { logout(); return; }
      setAccessToken(data.accessToken);
      const stored = localStorage.getItem("auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem("auth", JSON.stringify({ ...parsed, accessToken: data.accessToken }));
      }
      scheduleRefresh(data.accessToken);
    } catch {
      logout();
    }
  };

  const login = (token: string, u: User) => {
    setUser(u);
    setAccessToken(token);
    localStorage.setItem("auth", JSON.stringify({ user: u, accessToken: token }));
    scheduleRefresh(token);
  };

  // On mount: schedule refresh for existing token
  useEffect(() => {
    if (accessToken) scheduleRefresh(accessToken);
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(user?.role || "");

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

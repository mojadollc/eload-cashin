"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      const { user, accessToken } = JSON.parse(stored);
      setUser(user);
      setAccessToken(accessToken);
    }
  }, []);

  const login = (token: string, u: User) => {
    setUser(u);
    setAccessToken(token);
    localStorage.setItem("auth", JSON.stringify({ user: u, accessToken: token }));
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("auth");
    window.location.href = "/login";
  };

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(user?.role || "");

  return <AuthContext.Provider value={{ user, accessToken, login, logout, isAdmin }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

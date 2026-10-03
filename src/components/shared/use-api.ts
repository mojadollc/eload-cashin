"use client";
import { useAuth } from "@/components/shared/auth-context";
import { useCallback } from "react";

export function useApi() {
  const { accessToken, logout } = useAuth();

  const request = useCallback(async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });

    if (res.status === 401) { logout(); return null; }
    const text = await res.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return { error: `Server error (${res.status})` }; }
  }, [accessToken, logout]);

  return {
    get: (url: string) => request(url),
    post: (url: string, body: unknown) => request(url, { method: "POST", body: JSON.stringify(body) }),
    put: (url: string, body: unknown) => request(url, { method: "PUT", body: JSON.stringify(body) }),
    del: (url: string) => request(url, { method: "DELETE" }),
  };
}

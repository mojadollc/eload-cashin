"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/components/shared/auth-context";
import { useApi } from "@/components/shared/use-api";

export function LocationTracker() {
  const { user } = useAuth();
  const api = useApi();
  const sentRef = useRef(false);

  useEffect(() => {
    if (!user || sentRef.current) return;

    const requestLocation = async () => {
      if (!navigator.geolocation) {
        console.log("[location] not supported");
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });

        const { latitude, longitude } = position.coords;
        console.log("[location] got GPS:", latitude, longitude);

        await api.post("/api/auth/session/location", { latitude, longitude });
        sentRef.current = true;
      } catch (err: any) {
        console.log("[location] denied or error:", err?.message);
      }
    };

    // Small delay to ensure app is loaded
    const timer = setTimeout(requestLocation, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  return null;
}
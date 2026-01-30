"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback } from "react";

/**
 * Hook that bridges Privy authentication to Convex
 * This is passed to ConvexProviderWithAuth to enable authenticated Convex calls
 */
export function usePrivyAuthForConvex() {
  const { ready, authenticated, getAccessToken } = usePrivy();

  const fetchAccessToken = useCallback(
    async (_options: { forceRefreshToken: boolean }) => {
      try {
        const token = await getAccessToken();
        if (token) {
          // Debug: log token info (first 50 chars only for security)
          console.log("[CONVEX AUTH] Token obtained:", token.substring(0, 50) + "...");
          // Decode and log claims (without signature)
          try {
            const parts = token.split(".");
            if (parts[1]) {
              const payload = JSON.parse(atob(parts[1]));
              console.log("[CONVEX AUTH] Token claims:", {
                iss: payload.iss,
                aud: payload.aud,
                sub: payload.sub?.substring(0, 20) + "...",
                exp: new Date(payload.exp * 1000).toISOString(),
              });
            }
          } catch {
            console.log("[CONVEX AUTH] Could not decode token payload");
          }
        } else {
          console.log("[CONVEX AUTH] No token returned from getAccessToken");
        }
        return token;
      } catch (err) {
        console.error("[CONVEX AUTH] Error getting access token:", err);
        return null;
      }
    },
    [getAccessToken]
  );

  return {
    isLoading: !ready,
    isAuthenticated: authenticated,
    fetchAccessToken,
  };
}

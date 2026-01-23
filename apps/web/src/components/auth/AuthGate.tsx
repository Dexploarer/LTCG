"use client";

import { type ReactNode, useEffect } from "react";

interface AuthGateProps {
  isLoading: boolean;
  isAuthenticated: boolean;
  loadingFallback?: ReactNode;
  unauthenticatedFallback?: ReactNode;
  onUnauthenticated?: () => void;
  children: ReactNode;
}

export function AuthGate({
  isLoading,
  isAuthenticated,
  loadingFallback,
  unauthenticatedFallback,
  onUnauthenticated,
  children,
}: AuthGateProps) {
  useEffect(() => {
    if (!isLoading && !isAuthenticated && onUnauthenticated) {
      onUnauthenticated();
    }
  }, [isLoading, isAuthenticated, onUnauthenticated]);

  if (isLoading) {
    return <>{loadingFallback ?? null}</>;
  }

  if (!isAuthenticated) {
    return <>{unauthenticatedFallback ?? null}</>;
  }

  return <>{children}</>;
}

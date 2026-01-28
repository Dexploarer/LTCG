"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "../auth/useConvexAuthHook";
import type { Id } from "@convex/_generated/dataModel";

/**
 * useProfile Hook
 *
 * User profile data:
 * - Get current user profile
 * - Get other user profiles
 * - Determine if viewing own profile
 */
export function useProfile(userId?: Id<"users">) {
  const { isAuthenticated } = useAuth();

  // Current user
  const currentUser = useQuery(
    // @ts-ignore - Type depth issue with Convex generated types
    api.core.users.currentUser,
    isAuthenticated ? {} : "skip"
  );

  // Other user
  const otherUser = useQuery(
    // @ts-ignore - Type depth issue with Convex generated types
    api.core.users.getUser,
    userId ? { userId } : "skip"
  );

  const profile = userId ? otherUser : currentUser;

  return {
    profile,
    isLoading: profile === undefined,
    isCurrentUser: !userId || (currentUser && userId === currentUser._id),
  };
}

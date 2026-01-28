/**
 * Auth hooks re-export
 * Convex Auth provides these hooks directly from their packages
 */

// Re-export auth state hook from convex/react
export { useConvexAuth as useAuth } from "convex/react";

// Re-export auth actions from @convex-dev/auth/react
export { useAuthActions } from "@convex-dev/auth/react";

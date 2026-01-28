"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "../auth/useConvexAuthHook";
import { toast } from "sonner";

/**
 * usePromoCode Hook
 *
 * Promo code redemption functionality.
 */
export function usePromoCode() {
  const { isAuthenticated } = useAuth();

  const redeemMutation = useMutation(api.economy.redeemPromoCode);

  const redeemCode = async (code: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      const result = await redeemMutation({ code });
      toast.success(`Promo code redeemed! You got ${result.rewardDescription}`);
      return result;
    } catch (error: any) {
      toast.error(error.message || "Failed to redeem promo code");
      throw error;
    }
  };

  return { redeemCode };
}

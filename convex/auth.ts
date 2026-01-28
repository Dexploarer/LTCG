import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { query } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        const flow = params.flow as string;

        // Only initialize custom fields on signUp, not signIn
        if (flow === "signUp") {
          return {
            email: params.email as string,
            name: params.name as string,
            // Initialize custom game fields ONLY on sign up
            username: params.name as string,
            createdAt: Date.now(),
            rankedElo: 1000,
            casualRating: 1000,
            totalWins: 0,
            totalLosses: 0,
            rankedWins: 0,
            rankedLosses: 0,
            casualWins: 0,
            casualLosses: 0,
            storyWins: 0,
            xp: 0,
            level: 1,
            gold: 500,
            isAiAgent: false,
          };
        }

        // For signIn, just return email
        return {
          email: params.email as string,
        };
      },
    }),
  ],
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});

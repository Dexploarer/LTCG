import { internalMutation } from "../_generated/server";

/**
 * Migration: Rename 'element' field to 'archetype' in cardDefinitions and cards tables
 * Run with: bunx convex run migrations/renameElementToArchetype:migrateCards
 */
export const migrateCards = internalMutation({
  args: {},
  handler: async (ctx) => {
    let migrated = 0;
    let skipped = 0;

    // Migrate cardDefinitions table
    const cardDefs = await ctx.db.query("cardDefinitions").collect();

    for (const card of cardDefs) {
      const cardData = card as any;

      // Check if card has element field but no archetype
      if (cardData.element && !cardData.archetype) {
        await ctx.db.patch(card._id, {
          archetype: cardData.element,
        });
        migrated++;
      } else {
        skipped++;
      }
    }

    // Migrate cards table
    const cards = await ctx.db.query("cards").collect();

    for (const card of cards) {
      const cardData = card as any;

      // Check if card has element field but no archetype
      if (cardData.element && !cardData.archetype) {
        await ctx.db.patch(card._id, {
          archetype: cardData.element,
        });
        migrated++;
      } else {
        skipped++;
      }
    }

    return {
      success: true,
      migrated,
      skipped,
      message: `Migrated ${migrated} cards, skipped ${skipped}`,
    };
  },
});

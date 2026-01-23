/**
 * Astro Content Collections Configuration
 *
 * Defines content collections for the wiki:
 * - docs: Static MDX documentation pages (rules, mechanics, economy)
 * - cards: Dynamic card data fetched from Convex at build time
 * - archetypes: Archetype definitions fetched from Convex
 */

import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

// =============================================================================
// Convex HTTP Query Helper
// =============================================================================

const CONVEX_URL = import.meta.env.PUBLIC_CONVEX_URL || import.meta.env.CONVEX_URL;

/**
 * Call a Convex query function via HTTP
 * Uses the Convex HTTP API format: POST /api/query with { path, args }
 */
async function queryConvex<T>(functionPath: string, args: Record<string, unknown> = {}): Promise<T | null> {
  if (!CONVEX_URL) {
    console.warn("CONVEX_URL not set. Card data will not be available during build.");
    return null;
  }

  try {
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: functionPath,
        args,
      }),
    });

    if (!response.ok) {
      throw new Error(`Convex query failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.value as T;
  } catch (error) {
    console.error(`Failed to query Convex function ${functionPath}:`, error);
    return null;
  }
}

// =============================================================================
// Zod Schemas for Convex Data
// =============================================================================

const monsterStatsSchema = z.object({
  attack: z.number(),
  defense: z.number(),
  level: z.number(),
  attribute: z
    .enum(["fire", "water", "earth", "wind", "light", "dark", "divine"])
    .optional(),
  monsterType: z.string().optional(),
  isEffect: z.boolean().optional(),
});

const cardEffectSchema = z.object({
  name: z.string(),
  description: z.string(),
  effectType: z
    .enum(["continuous", "activated", "triggered", "quick", "ignition", "counter"])
    .optional(),
  cost: z.string().optional(),
});

const evolutionCostSchema = z.object({
  lpCost: z.number().optional(),
});

const cardSchema = z.object({
  id: z.string(),
  cardNumber: z.string(),
  name: z.string(),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]),
  setCode: z.string(),
  cardType: z.enum(["monster", "spell", "trap", "equipment", "field", "ritual", "fusion", "token"]),
  archetype: z.string().optional(),
  imageUrl: z.string().nullish(),

  // Monster stats
  monsterStats: monsterStatsSchema.optional(),

  // Effects
  effects: z.array(cardEffectSchema).default([]),
  flavorText: z.string().optional(),

  // Deck status
  isLimited: z.boolean().default(false),
  isBanned: z.boolean().default(false),

  // Variations
  variation: z
    .enum(["normal", "foil", "holographic", "secret", "ultimate", "prismatic"])
    .default("normal"),
  isPrismatic: z.boolean().default(false),

  // Evolution
  evolvesFrom: z.array(z.string()).optional(),
  evolutionStage: z.enum(["base", "ascended", "apex"]).optional(),
  evolutionLineId: z.string().optional(),
  branchCondition: z.string().optional(),
  evolutionCost: evolutionCostSchema.optional(),
  canEvolveInto: z.array(z.string()).optional(),
});

const archetypeSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  attribute: z.enum(["fire", "water", "earth", "wind", "light", "dark", "divine"]),
  playstyle: z.string(),
  signatureMechanic: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
});

// =============================================================================
// Card data type from Convex
// =============================================================================

interface ConvexCard {
  id: string;
  cardNumber: string;
  name: string;
  rarity: string;
  setCode: string;
  cardType: string;
  archetype?: string;
  imageUrl?: string;
  monsterStats?: {
    attack: number;
    defense: number;
    level: number;
    attribute?: string;
    monsterType?: string;
    isEffect?: boolean;
  };
  effects?: Array<{
    name: string;
    description: string;
    effectType?: string;
    cost?: string;
  }>;
  flavorText?: string;
  isLimited?: boolean;
  isBanned?: boolean;
  variation?: string;
  isPrismatic?: boolean;
  evolvesFrom?: string[];
  evolutionStage?: string;
  evolutionLineId?: string;
  branchCondition?: string;
  evolutionCost?: { lpCost?: number };
  canEvolveInto?: string[];
}

interface ConvexArchetype {
  name: string;
  shortName: string;
  attribute: string;
  playstyle: string;
  signatureMechanic: string;
  description: string;
  keywords: string[];
}

// =============================================================================
// Content Collections
// =============================================================================

export const collections = {
  // Static documentation pages
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // Custom frontmatter fields for card/archetype pages
        cardNumber: z.string().optional(),
        archetype: z.string().optional(),
      }),
    }),
  }),

  // Dynamic card data from Convex
  cards: defineCollection({
    loader: async () => {
      const cards = await queryConvex<ConvexCard[]>("wiki:getAllCards");

      if (!cards || cards.length === 0) {
        console.warn("No cards returned from Convex, using empty collection");
        return [];
      }

      console.log(`Loaded ${cards.length} cards from Convex`);

      return cards.map(({ id: _convexId, ...card }) => ({
        id: card.cardNumber.toLowerCase(),
        ...card,
      }));
    },
    schema: cardSchema,
  }),

  // Archetype definitions from Convex
  archetypes: defineCollection({
    loader: async () => {
      const archetypes = await queryConvex<ConvexArchetype[]>("wiki:getArchetypes");

      if (!archetypes || archetypes.length === 0) {
        console.warn("No archetypes returned from Convex, using empty collection");
        return [];
      }

      console.log(`Loaded ${archetypes.length} archetypes from Convex`);

      return archetypes.map((arch) => ({
        id: arch.name.toLowerCase().replace(/\s+/g, "-"),
        ...arch,
      }));
    },
    schema: archetypeSchema,
  }),
};

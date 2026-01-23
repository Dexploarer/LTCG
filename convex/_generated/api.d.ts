/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_mutations from "../admin/mutations.js";
import type * as admin_shopSetup from "../admin/shopSetup.js";
import type * as agents from "../agents.js";
import type * as auth from "../auth.js";
import type * as cards from "../cards.js";
import type * as decks from "../decks.js";
import type * as economy from "../economy.js";
import type * as globalChat from "../globalChat.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as lib_types from "../lib/types.js";
import type * as lib_validators from "../lib/validators.js";
import type * as marketplace from "../marketplace.js";
import type * as migrations_renameElementToArchetype from "../migrations/renameElementToArchetype.js";
import type * as seeds_seedStarterCards from "../seeds/seedStarterCards.js";
import type * as seeds_starterDecks from "../seeds/starterDecks.js";
import type * as seeds_updateCardAbilities from "../seeds/updateCardAbilities.js";
import type * as setupSystem from "../setupSystem.js";
import type * as shop from "../shop.js";
import type * as storage_cards from "../storage/cards.js";
import type * as storage_images from "../storage/images.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/mutations": typeof admin_mutations;
  "admin/shopSetup": typeof admin_shopSetup;
  agents: typeof agents;
  auth: typeof auth;
  cards: typeof cards;
  decks: typeof decks;
  economy: typeof economy;
  globalChat: typeof globalChat;
  "lib/auth": typeof lib_auth;
  "lib/constants": typeof lib_constants;
  "lib/helpers": typeof lib_helpers;
  "lib/types": typeof lib_types;
  "lib/validators": typeof lib_validators;
  marketplace: typeof marketplace;
  "migrations/renameElementToArchetype": typeof migrations_renameElementToArchetype;
  "seeds/seedStarterCards": typeof seeds_seedStarterCards;
  "seeds/starterDecks": typeof seeds_starterDecks;
  "seeds/updateCardAbilities": typeof seeds_updateCardAbilities;
  setupSystem: typeof setupSystem;
  shop: typeof shop;
  "storage/cards": typeof storage_cards;
  "storage/images": typeof storage_images;
  users: typeof users;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  ratelimiter: {
    public: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
  };
};

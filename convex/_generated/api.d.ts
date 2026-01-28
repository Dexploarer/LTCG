/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as __mocks___ratelimiter from "../__mocks__/ratelimiter.js";
import type * as admin_mutations from "../admin/mutations.js";
import type * as admin_shopSetup from "../admin/shopSetup.js";
import type * as agents from "../agents.js";
import type * as auth from "../auth.js";
import type * as cards from "../cards.js";
import type * as chainResolver from "../chainResolver.js";
import type * as cleanupAuth from "../cleanupAuth.js";
import type * as core_cards from "../core/cards.js";
import type * as core_decks from "../core/decks.js";
import type * as core_users from "../core/users.js";
import type * as decks from "../decks.js";
import type * as economy from "../economy.js";
import type * as economy_economy from "../economy/economy.js";
import type * as economy_marketplace from "../economy/marketplace.js";
import type * as economy_shop from "../economy/shop.js";
import type * as effectSystem from "../effectSystem.js";
import type * as friends from "../friends.js";
import type * as gameEngine from "../gameEngine.js";
import type * as gameEvents from "../gameEvents.js";
import type * as gameplay_ai_aiDifficulty from "../gameplay/ai/aiDifficulty.js";
import type * as gameplay_ai_aiEngine from "../gameplay/ai/aiEngine.js";
import type * as gameplay_ai_aiTurn from "../gameplay/ai/aiTurn.js";
import type * as gameplay_chainResolver from "../gameplay/chainResolver.js";
import type * as gameplay_combatSystem from "../gameplay/combatSystem.js";
import type * as gameplay_effectSystem_executor from "../gameplay/effectSystem/executor.js";
import type * as gameplay_effectSystem_executors_banish from "../gameplay/effectSystem/executors/banish.js";
import type * as gameplay_effectSystem_executors_damage from "../gameplay/effectSystem/executors/damage.js";
import type * as gameplay_effectSystem_executors_destroy from "../gameplay/effectSystem/executors/destroy.js";
import type * as gameplay_effectSystem_executors_draw from "../gameplay/effectSystem/executors/draw.js";
import type * as gameplay_effectSystem_executors_gainLP from "../gameplay/effectSystem/executors/gainLP.js";
import type * as gameplay_effectSystem_executors_index from "../gameplay/effectSystem/executors/index.js";
import type * as gameplay_effectSystem_executors_modifyATK from "../gameplay/effectSystem/executors/modifyATK.js";
import type * as gameplay_effectSystem_executors_negate from "../gameplay/effectSystem/executors/negate.js";
import type * as gameplay_effectSystem_executors_returnToDeck from "../gameplay/effectSystem/executors/returnToDeck.js";
import type * as gameplay_effectSystem_executors_search from "../gameplay/effectSystem/executors/search.js";
import type * as gameplay_effectSystem_executors_summon from "../gameplay/effectSystem/executors/summon.js";
import type * as gameplay_effectSystem_executors_toGraveyard from "../gameplay/effectSystem/executors/toGraveyard.js";
import type * as gameplay_effectSystem_executors_toHand from "../gameplay/effectSystem/executors/toHand.js";
import type * as gameplay_effectSystem_index from "../gameplay/effectSystem/index.js";
import type * as gameplay_effectSystem_parser from "../gameplay/effectSystem/parser.js";
import type * as gameplay_effectSystem_types from "../gameplay/effectSystem/types.js";
import type * as gameplay_gameEngine_index from "../gameplay/gameEngine/index.js";
import type * as gameplay_gameEngine_positions from "../gameplay/gameEngine/positions.js";
import type * as gameplay_gameEngine_spellsTraps from "../gameplay/gameEngine/spellsTraps.js";
import type * as gameplay_gameEngine_summons from "../gameplay/gameEngine/summons.js";
import type * as gameplay_gameEngine_turns from "../gameplay/gameEngine/turns.js";
import type * as gameplay_gameEvents from "../gameplay/gameEvents.js";
import type * as gameplay_games_cleanup from "../gameplay/games/cleanup.js";
import type * as gameplay_games_index from "../gameplay/games/index.js";
import type * as gameplay_games_lifecycle from "../gameplay/games/lifecycle.js";
import type * as gameplay_games_lobby from "../gameplay/games/lobby.js";
import type * as gameplay_games_queries from "../gameplay/games/queries.js";
import type * as gameplay_games_spectator from "../gameplay/games/spectator.js";
import type * as gameplay_games_stats from "../gameplay/games/stats.js";
import type * as gameplay_phaseManager from "../gameplay/phaseManager.js";
import type * as gameplay_summonValidator from "../gameplay/summonValidator.js";
import type * as games from "../games.js";
import type * as globalChat from "../globalChat.js";
import type * as http from "../http.js";
import type * as infrastructure_aggregates from "../infrastructure/aggregates.js";
import type * as infrastructure_crons from "../infrastructure/crons.js";
import type * as infrastructure_shardedCounters from "../infrastructure/shardedCounters.js";
import type * as leaderboards from "../leaderboards.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_convexAuth from "../lib/convexAuth.js";
import type * as lib_deterministicRandom from "../lib/deterministicRandom.js";
import type * as lib_errorCodes from "../lib/errorCodes.js";
import type * as lib_gameHelpers from "../lib/gameHelpers.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_returnValidators from "../lib/returnValidators.js";
import type * as lib_schemaValidators from "../lib/schemaValidators.js";
import type * as lib_storyConstants from "../lib/storyConstants.js";
import type * as lib_types from "../lib/types.js";
import type * as lib_validators from "../lib/validators.js";
import type * as lib_xpHelpers from "../lib/xpHelpers.js";
import type * as marketplace from "../marketplace.js";
import type * as matchmaking from "../matchmaking.js";
import type * as migrations_addLeaderboardFields from "../migrations/addLeaderboardFields.js";
import type * as migrations_updateArchetypes from "../migrations/updateArchetypes.js";
import type * as migrations_updateShopProducts from "../migrations/updateShopProducts.js";
import type * as progression_achievements from "../progression/achievements.js";
import type * as progression_index from "../progression/index.js";
import type * as progression_matchHistory from "../progression/matchHistory.js";
import type * as progression_quests from "../progression/quests.js";
import type * as progression_story from "../progression/story.js";
import type * as progression_storyBattle from "../progression/storyBattle.js";
import type * as progression_storyQueries from "../progression/storyQueries.js";
import type * as progression_storyStages from "../progression/storyStages.js";
import type * as router from "../router.js";
import type * as scripts_seedStarterCards from "../scripts/seedStarterCards.js";
import type * as scripts_seedStoryChapters from "../scripts/seedStoryChapters.js";
import type * as scripts_updateShopProductsArchetypes from "../scripts/updateShopProductsArchetypes.js";
import type * as seedStarterCards from "../seedStarterCards.js";
import type * as seeds_starterCards from "../seeds/starterCards.js";
import type * as seeds_starterDecks from "../seeds/starterDecks.js";
import type * as seeds_storyChapters from "../seeds/storyChapters.js";
import type * as seeds_storyStages from "../seeds/storyStages.js";
import type * as seeds_types from "../seeds/types.js";
import type * as setupSystem from "../setupSystem.js";
import type * as shop from "../shop.js";
import type * as social_friends from "../social/friends.js";
import type * as social_globalChat from "../social/globalChat.js";
import type * as social_leaderboards from "../social/leaderboards.js";
import type * as social_matchmaking from "../social/matchmaking.js";
import type * as storage_cards from "../storage/cards.js";
import type * as storage_images from "../storage/images.js";
import type * as story from "../story.js";
import type * as test_utils_setup from "../test_utils/setup.js";
import type * as test_utils_utils from "../test_utils/utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "__mocks__/ratelimiter": typeof __mocks___ratelimiter;
  "admin/mutations": typeof admin_mutations;
  "admin/shopSetup": typeof admin_shopSetup;
  agents: typeof agents;
  auth: typeof auth;
  cards: typeof cards;
  chainResolver: typeof chainResolver;
  cleanupAuth: typeof cleanupAuth;
  "core/cards": typeof core_cards;
  "core/decks": typeof core_decks;
  "core/users": typeof core_users;
  decks: typeof decks;
  economy: typeof economy;
  "economy/economy": typeof economy_economy;
  "economy/marketplace": typeof economy_marketplace;
  "economy/shop": typeof economy_shop;
  effectSystem: typeof effectSystem;
  friends: typeof friends;
  gameEngine: typeof gameEngine;
  gameEvents: typeof gameEvents;
  "gameplay/ai/aiDifficulty": typeof gameplay_ai_aiDifficulty;
  "gameplay/ai/aiEngine": typeof gameplay_ai_aiEngine;
  "gameplay/ai/aiTurn": typeof gameplay_ai_aiTurn;
  "gameplay/chainResolver": typeof gameplay_chainResolver;
  "gameplay/combatSystem": typeof gameplay_combatSystem;
  "gameplay/effectSystem/executor": typeof gameplay_effectSystem_executor;
  "gameplay/effectSystem/executors/banish": typeof gameplay_effectSystem_executors_banish;
  "gameplay/effectSystem/executors/damage": typeof gameplay_effectSystem_executors_damage;
  "gameplay/effectSystem/executors/destroy": typeof gameplay_effectSystem_executors_destroy;
  "gameplay/effectSystem/executors/draw": typeof gameplay_effectSystem_executors_draw;
  "gameplay/effectSystem/executors/gainLP": typeof gameplay_effectSystem_executors_gainLP;
  "gameplay/effectSystem/executors/index": typeof gameplay_effectSystem_executors_index;
  "gameplay/effectSystem/executors/modifyATK": typeof gameplay_effectSystem_executors_modifyATK;
  "gameplay/effectSystem/executors/negate": typeof gameplay_effectSystem_executors_negate;
  "gameplay/effectSystem/executors/returnToDeck": typeof gameplay_effectSystem_executors_returnToDeck;
  "gameplay/effectSystem/executors/search": typeof gameplay_effectSystem_executors_search;
  "gameplay/effectSystem/executors/summon": typeof gameplay_effectSystem_executors_summon;
  "gameplay/effectSystem/executors/toGraveyard": typeof gameplay_effectSystem_executors_toGraveyard;
  "gameplay/effectSystem/executors/toHand": typeof gameplay_effectSystem_executors_toHand;
  "gameplay/effectSystem/index": typeof gameplay_effectSystem_index;
  "gameplay/effectSystem/parser": typeof gameplay_effectSystem_parser;
  "gameplay/effectSystem/types": typeof gameplay_effectSystem_types;
  "gameplay/gameEngine/index": typeof gameplay_gameEngine_index;
  "gameplay/gameEngine/positions": typeof gameplay_gameEngine_positions;
  "gameplay/gameEngine/spellsTraps": typeof gameplay_gameEngine_spellsTraps;
  "gameplay/gameEngine/summons": typeof gameplay_gameEngine_summons;
  "gameplay/gameEngine/turns": typeof gameplay_gameEngine_turns;
  "gameplay/gameEvents": typeof gameplay_gameEvents;
  "gameplay/games/cleanup": typeof gameplay_games_cleanup;
  "gameplay/games/index": typeof gameplay_games_index;
  "gameplay/games/lifecycle": typeof gameplay_games_lifecycle;
  "gameplay/games/lobby": typeof gameplay_games_lobby;
  "gameplay/games/queries": typeof gameplay_games_queries;
  "gameplay/games/spectator": typeof gameplay_games_spectator;
  "gameplay/games/stats": typeof gameplay_games_stats;
  "gameplay/phaseManager": typeof gameplay_phaseManager;
  "gameplay/summonValidator": typeof gameplay_summonValidator;
  games: typeof games;
  globalChat: typeof globalChat;
  http: typeof http;
  "infrastructure/aggregates": typeof infrastructure_aggregates;
  "infrastructure/crons": typeof infrastructure_crons;
  "infrastructure/shardedCounters": typeof infrastructure_shardedCounters;
  leaderboards: typeof leaderboards;
  "lib/constants": typeof lib_constants;
  "lib/convexAuth": typeof lib_convexAuth;
  "lib/deterministicRandom": typeof lib_deterministicRandom;
  "lib/errorCodes": typeof lib_errorCodes;
  "lib/gameHelpers": typeof lib_gameHelpers;
  "lib/helpers": typeof lib_helpers;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/returnValidators": typeof lib_returnValidators;
  "lib/schemaValidators": typeof lib_schemaValidators;
  "lib/storyConstants": typeof lib_storyConstants;
  "lib/types": typeof lib_types;
  "lib/validators": typeof lib_validators;
  "lib/xpHelpers": typeof lib_xpHelpers;
  marketplace: typeof marketplace;
  matchmaking: typeof matchmaking;
  "migrations/addLeaderboardFields": typeof migrations_addLeaderboardFields;
  "migrations/updateArchetypes": typeof migrations_updateArchetypes;
  "migrations/updateShopProducts": typeof migrations_updateShopProducts;
  "progression/achievements": typeof progression_achievements;
  "progression/index": typeof progression_index;
  "progression/matchHistory": typeof progression_matchHistory;
  "progression/quests": typeof progression_quests;
  "progression/story": typeof progression_story;
  "progression/storyBattle": typeof progression_storyBattle;
  "progression/storyQueries": typeof progression_storyQueries;
  "progression/storyStages": typeof progression_storyStages;
  router: typeof router;
  "scripts/seedStarterCards": typeof scripts_seedStarterCards;
  "scripts/seedStoryChapters": typeof scripts_seedStoryChapters;
  "scripts/updateShopProductsArchetypes": typeof scripts_updateShopProductsArchetypes;
  seedStarterCards: typeof seedStarterCards;
  "seeds/starterCards": typeof seeds_starterCards;
  "seeds/starterDecks": typeof seeds_starterDecks;
  "seeds/storyChapters": typeof seeds_storyChapters;
  "seeds/storyStages": typeof seeds_storyStages;
  "seeds/types": typeof seeds_types;
  setupSystem: typeof setupSystem;
  shop: typeof shop;
  "social/friends": typeof social_friends;
  "social/globalChat": typeof social_globalChat;
  "social/leaderboards": typeof social_leaderboards;
  "social/matchmaking": typeof social_matchmaking;
  "storage/cards": typeof storage_cards;
  "storage/images": typeof storage_images;
  story: typeof story;
  "test_utils/setup": typeof test_utils_setup;
  "test_utils/utils": typeof test_utils_utils;
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
  aggregate: {
    btree: {
      aggregateBetween: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any },
        { count: number; sum: number }
      >;
      aggregateBetweenBatch: FunctionReference<
        "query",
        "internal",
        { queries: Array<{ k1?: any; k2?: any; namespace?: any }> },
        Array<{ count: number; sum: number }>
      >;
      atNegativeOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffsetBatch: FunctionReference<
        "query",
        "internal",
        {
          queries: Array<{
            k1?: any;
            k2?: any;
            namespace?: any;
            offset: number;
          }>;
        },
        Array<{ k: any; s: number; v: any }>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: any; namespace?: any },
        null | { k: any; s: number; v: any }
      >;
      offset: FunctionReference<
        "query",
        "internal",
        { k1?: any; key: any; namespace?: any },
        number
      >;
      offsetUntil: FunctionReference<
        "query",
        "internal",
        { k2?: any; key: any; namespace?: any },
        number
      >;
      paginate: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          k1?: any;
          k2?: any;
          limit: number;
          namespace?: any;
          order: "asc" | "desc";
        },
        {
          cursor: string;
          isDone: boolean;
          page: Array<{ k: any; s: number; v: any }>;
        }
      >;
      paginateNamespaces: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit: number },
        { cursor: string; isDone: boolean; page: Array<any> }
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { namespace?: any },
        any
      >;
    };
    inspect: {
      display: FunctionReference<"query", "internal", { namespace?: any }, any>;
      dump: FunctionReference<"query", "internal", { namespace?: any }, string>;
      inspectNode: FunctionReference<
        "query",
        "internal",
        { namespace?: any; node?: string },
        null
      >;
      listTreeNodes: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          aggregate?: { count: number; sum: number };
          items: Array<{ k: any; s: number; v: any }>;
          subtrees: Array<string>;
        }>
      >;
      listTrees: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          maxNodeSize: number;
          namespace?: any;
          root: string;
        }>
      >;
    };
    public: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      delete_: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        null
      >;
      deleteIfExists: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        any
      >;
      init: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any; summand?: number; value: any },
        null
      >;
      makeRootLazy: FunctionReference<
        "mutation",
        "internal",
        { namespace?: any },
        null
      >;
      replace: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        null
      >;
      replaceOrInsert: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        any
      >;
    };
  };
  shardedCounter: {
    public: {
      add: FunctionReference<
        "mutation",
        "internal",
        { count: number; name: string; shard?: number; shards?: number },
        number
      >;
      count: FunctionReference<"query", "internal", { name: string }, number>;
      estimateCount: FunctionReference<
        "query",
        "internal",
        { name: string; readFromShards?: number; shards?: number },
        any
      >;
      rebalance: FunctionReference<
        "mutation",
        "internal",
        { name: string; shards?: number },
        any
      >;
      reset: FunctionReference<"mutation", "internal", { name: string }, any>;
    };
  };
};

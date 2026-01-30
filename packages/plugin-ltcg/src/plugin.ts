import type { Plugin } from '@elizaos/core';
import {
  type Action,
  type ActionResult,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  type RouteRequest,
  type RouteResponse,
  Service,
  type State,
  logger,
} from '@elizaos/core';
import { z } from 'zod';

// Import LTCG actions, providers, and evaluators
import { ltcgActions } from './actions';
import { ltcgProviders } from './providers';
import { ltcgEvaluators } from './evaluators';
import { LTCGRealtimeService } from './services/LTCGRealtimeService';

/**
 * Define the configuration schema for the LTCG plugin
 *
 * Required:
 * - LTCG_API_KEY: Authentication key for LTCG API
 * - CONVEX_URL: Convex backend URL for real-time updates
 *
 * Optional:
 * - LTCG_BASE_URL: Override API base URL (defaults to production)
 * - LTCG_AUTO_MATCHMAKING: Automatically find and join games (true/false)
 * - LTCG_DEBUG_MODE: Enable debug logging for real-time client (true/false)
 */
const configSchema = z.object({
  LTCG_API_KEY: z
    .string()
    .min(1, 'LTCG_API_KEY is required for authentication')
    .optional()
    .transform((val) => {
      if (!val) {
        console.warn('Warning: LTCG_API_KEY is not provided - agent will not be able to play games');
      }
      return val;
    }),
  CONVEX_URL: z
    .string()
    .min(1, 'CONVEX_URL is required for real-time game updates')
    .optional()
    .transform((val) => {
      if (!val) {
        console.warn('Warning: CONVEX_URL is not provided - real-time updates will not work');
      }
      return val;
    }),
  LTCG_BASE_URL: z
    .string()
    .url('LTCG_BASE_URL must be a valid URL')
    .optional(),
  LTCG_AUTO_MATCHMAKING: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  LTCG_DEBUG_MODE: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

const plugin: Plugin = {
  name: 'ltcg',
  description: 'LTCG card game plugin - enables AI agents to play the Legendary Trading Card Game with full gameplay capabilities, real-time updates, and customizable personalities',
  // Set lowest priority so real models take precedence
  priority: -1000,
  config: {
    LTCG_API_KEY: process.env.LTCG_API_KEY,
    CONVEX_URL: process.env.CONVEX_URL,
    LTCG_BASE_URL: process.env.LTCG_BASE_URL,
    LTCG_AUTO_MATCHMAKING: process.env.LTCG_AUTO_MATCHMAKING,
    LTCG_DEBUG_MODE: process.env.LTCG_DEBUG_MODE,
  },
  async init(config: Record<string, string>) {
    logger.info('*** Initializing LTCG plugin ***');
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set all environment variables at once
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value !== undefined) process.env[key] = String(value);
      }

      // Log configuration status (without sensitive data)
      logger.info({
        hasApiKey: !!validatedConfig.LTCG_API_KEY,
        hasConvexUrl: !!validatedConfig.CONVEX_URL,
        autoMatchmaking: validatedConfig.LTCG_AUTO_MATCHMAKING,
      }, 'LTCG plugin configured');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages =
          error.issues?.map((e) => e.message)?.join(', ') || 'Unknown validation error';
        throw new Error(`Invalid LTCG plugin configuration: ${errorMessages}`);
      }
      throw new Error(
        `Invalid LTCG plugin configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  models: {
    [ModelType.TEXT_SMALL]: async (_runtime, { prompt }: GenerateTextParams) => {
      return 'Test response for small model';
    },
    [ModelType.TEXT_LARGE]: async (_runtime, { prompt }: GenerateTextParams) => {
      return 'Test response for large model';
    },
  },
  routes: [
    {
      name: 'helloworld',
      path: '/helloworld',
      type: 'GET',
      handler: async (_req: RouteRequest, res: RouteResponse) => {
        res.json({ message: 'Hello World!' });
      },
    },
  ],
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.info('MESSAGE_RECEIVED event received');
        // print the keys
        logger.info({ keys: Object.keys(params) }, 'MESSAGE_RECEIVED param keys');
      },
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger.info('VOICE_MESSAGE_RECEIVED event received');
        // print the keys
        logger.info({ keys: Object.keys(params) }, 'VOICE_MESSAGE_RECEIVED param keys');
      },
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger.info('WORLD_CONNECTED event received');
        // print the keys
        logger.info({ keys: Object.keys(params) }, 'WORLD_CONNECTED param keys');
      },
    ],
    WORLD_JOINED: [
      async (params) => {
        logger.info('WORLD_JOINED event received');
        // print the keys
        logger.info({ keys: Object.keys(params) }, 'WORLD_JOINED param keys');
      },
    ],
  },
  services: [LTCGRealtimeService],
  actions: ltcgActions,
  providers: ltcgProviders,
  evaluators: ltcgEvaluators,
};

export default plugin;

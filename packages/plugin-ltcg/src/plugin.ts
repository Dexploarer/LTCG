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
});

/**
 * Example HelloWorld action
 * This demonstrates the simplest possible action structure
 */
/**
 * Represents an action that responds with a simple hello world message.
 *
 * @typedef {Object} Action
 * @property {string} name - The name of the action
 * @property {string[]} similes - The related similes of the action
 * @property {string} description - Description of the action
 * @property {Function} validate - Validation function for the action
 * @property {Function} handler - The function that handles the action
 * @property {Object[]} examples - Array of examples for the action
 */
const helloWorldAction: Action = {
  name: 'HELLO_WORLD',
  similes: ['GREET', 'SAY_HELLO'],
  description: 'Responds with a simple hello world message',

  validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
    // Always valid
    return true;
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    try {
      logger.info('Handling HELLO_WORLD action');

      // Simple response content
      const responseContent: Content = {
        text: 'hello world!',
        actions: ['HELLO_WORLD'],
        source: message.content.source,
      };

      // Call back with the hello world message
      await callback(responseContent);

      return {
        text: 'Sent hello world greeting',
        values: {
          success: true,
          greeted: true,
        },
        data: {
          actionName: 'HELLO_WORLD',
          messageId: message.id,
          timestamp: Date.now(),
        },
        success: true,
      };
    } catch (error) {
      logger.error({ error }, 'Error in HELLO_WORLD action:');

      return {
        text: 'Failed to send hello world greeting',
        values: {
          success: false,
          error: 'GREETING_FAILED',
        },
        data: {
          actionName: 'HELLO_WORLD',
          error: error instanceof Error ? error.message : String(error),
        },
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Can you say hello?',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'hello world!',
          actions: ['HELLO_WORLD'],
        },
      },
    ],
  ],
};

/**
 * Example Hello World Provider
 * This demonstrates the simplest possible provider implementation
 */
const helloWorldProvider: Provider = {
  name: 'HELLO_WORLD_PROVIDER',
  description: 'A simple example provider',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    return {
      text: 'I am a provider',
      values: {},
      data: {},
    };
  },
};

export class StarterService extends Service {
  static serviceType = 'starter';
  capabilityDescription =
    'This is a starter service which is attached to the agent through the starter plugin.';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('*** Starting starter service ***');
    const service = new StarterService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('*** Stopping starter service ***');
    // get the service from the runtime
    const service = runtime.getService(StarterService.serviceType);
    if (!service) {
      throw new Error('Starter service not found');
    }
    service.stop();
  }

  async stop() {
    logger.info('*** Stopping starter service instance ***');
  }
}

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
    [ModelType.TEXT_SMALL]: async (
      _runtime,
      { prompt, stopSequences = [] }: GenerateTextParams
    ) => {
      return 'Never gonna give you up, never gonna let you down, never gonna run around and desert you...';
    },
    [ModelType.TEXT_LARGE]: async (
      _runtime,
      {
        prompt,
        stopSequences = [],
        maxTokens = 8192,
        temperature = 0.7,
        frequencyPenalty = 0.7,
        presencePenalty = 0.7,
      }: GenerateTextParams
    ) => {
      return 'Never gonna make you cry, never gonna say goodbye, never gonna tell a lie and hurt you...';
    },
  },
  routes: [
    {
      name: 'helloworld',
      path: '/helloworld',
      type: 'GET',
      handler: async (_req: RouteRequest, res: RouteResponse) => {
        // send a response
        res.json({
          message: 'Hello World!',
        });
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
  services: [StarterService],
  actions: [helloWorldAction, ...ltcgActions],
  providers: [helloWorldProvider, ...ltcgProviders],
  evaluators: [...ltcgEvaluators],
};

export default plugin;

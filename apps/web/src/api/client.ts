/**
 * Type-safe API Client
 * Handles HTTP requests with automatic validation using Zod
 */

import { z } from "zod";

/**
 * API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * API Client configuration
 */
export interface ApiClientConfig {
  baseUrl: string;
  headers?: HeadersInit;
  timeout?: number;
}

/**
 * Request options
 */
export interface RequestOptions extends RequestInit {
  timeout?: number;
  params?: Record<string, string | number | boolean>;
}

/**
 * Create an API client with type-safe request/response validation
 */
export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, headers: defaultHeaders = {}, timeout: defaultTimeout = 30000 } = config;

  /**
   * Make a validated API request
   * @param schema - Zod schema to validate the response
   * @param endpoint - API endpoint (will be appended to baseUrl)
   * @param options - Request options
   */
  async function request<T extends z.ZodTypeAny>(
    schema: T,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<z.infer<T>> {
    const { timeout = defaultTimeout, params, ...fetchOptions } = options;

    // Build URL with query params
    const url = new URL(endpoint, baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, String(value));
      }
    }

    // Merge headers
    const headers = new Headers(defaultHeaders);
    if (fetchOptions.headers) {
      const optionHeaders = new Headers(fetchOptions.headers);
      for (const [key, value] of optionHeaders.entries()) {
        headers.set(key, value);
      }
    }

    // Set default content type if not provided
    if (!headers.has("Content-Type") && fetchOptions.body) {
      headers.set("Content-Type", "application/json");
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      // Clear timeout
      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new ApiError(
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      // Parse and validate response
      const data = await response.json();
      const validated = schema.parse(data);

      return validated;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if ((error as Error).name === "AbortError") {
        throw new ApiError("Request timeout", 408);
      }

      // Re-throw validation errors
      if (error instanceof z.ZodError) {
        throw new ApiError("Invalid response format", 500, error.issues);
      }

      throw error;
    }
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  return {
    get: <T extends z.ZodTypeAny>(schema: T, endpoint: string, options?: RequestOptions) =>
      request(schema, endpoint, { ...options, method: "GET" }),

    post: <T extends z.ZodTypeAny>(
      schema: T,
      endpoint: string,
      body?: unknown,
      options?: RequestOptions
    ) =>
      request(schema, endpoint, {
        ...options,
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }),

    put: <T extends z.ZodTypeAny>(
      schema: T,
      endpoint: string,
      body?: unknown,
      options?: RequestOptions
    ) =>
      request(schema, endpoint, {
        ...options,
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      }),

    patch: <T extends z.ZodTypeAny>(
      schema: T,
      endpoint: string,
      body?: unknown,
      options?: RequestOptions
    ) =>
      request(schema, endpoint, {
        ...options,
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      }),

    delete: <T extends z.ZodTypeAny>(schema: T, endpoint: string, options?: RequestOptions) =>
      request(schema, endpoint, { ...options, method: "DELETE" }),
  };
}

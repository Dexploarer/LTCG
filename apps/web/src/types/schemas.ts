/**
 * Zod v4 Validation Schemas
 * Centralized type-safe validation for the entire application
 */

import { z } from "zod";

// =============================================================================
// Base Schemas
// =============================================================================

/**
 * ID schema - ensures valid string IDs
 */
export const idSchema = z.string().min(1);

/**
 * Timestamp schema - ensures valid Unix timestamps
 */
export const timestampSchema = z.number().int().positive();

/**
 * Pagination schema - for paginated API responses
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  total: z.number().int().nonnegative(),
});

// =============================================================================
// Example Domain Schemas (Replace with your actual domain)
// =============================================================================

/**
 * User schema
 */
export const userSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(100),
  email: z.string().email(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type User = z.infer<typeof userSchema>;

/**
 * API Response wrapper
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: timestampSchema,
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
};

/**
 * Paginated response wrapper
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: paginationSchema,
  });

export type PaginatedResponse<T> = {
  items: T[];
  pagination: z.infer<typeof paginationSchema>;
};

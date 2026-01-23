/**
 * Example TanStack Query Hooks
 * Demonstrates best practices for query and mutation hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createApiClient } from "../api/client";
import { apiResponseSchema, userSchema } from "../types/schemas";

// Initialize API client
const api = createApiClient({
  baseUrl: process.env.API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query key factory - ensures consistent query key structure
 */
export const queryKeys = {
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters: string) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch all users
 */
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: async () => {
      const response = await api.get(apiResponseSchema(z.array(userSchema)), "/users");
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch users");
      }
      return response.data;
    },
  });
}

/**
 * Fetch a single user by ID
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async () => {
      const response = await api.get(apiResponseSchema(userSchema), `/users/${userId}`);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch user");
      }
      return response.data;
    },
    enabled: !!userId, // Only run if userId is provided
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Input schema for creating a user
 */
const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const validated = createUserSchema.parse(input);
      const response = await api.post(apiResponseSchema(userSchema), "/users", validated);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to create user");
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Update an existing user
 */
const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

type UpdateUserInput = z.infer<typeof updateUserSchema>;

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const validated = updateUserSchema.parse(input);
      const { id, ...body } = validated;

      const response = await api.patch(apiResponseSchema(userSchema), `/users/${id}`, body);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to update user");
      }

      return response.data;
    },
    onSuccess: (data) => {
      // Update the specific user in cache
      queryClient.setQueryData(queryKeys.users.detail(data.id), data);

      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(
        apiResponseSchema(z.object({ id: z.string() })),
        `/users/${userId}`
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to delete user");
      }

      return userId;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(deletedId) });

      // Refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

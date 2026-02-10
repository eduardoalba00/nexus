import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().nullable().optional(),
  permissions: z.number().int().min(0).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().nullable().optional(),
  permissions: z.number().int().min(0).optional(),
  position: z.number().int().min(0).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

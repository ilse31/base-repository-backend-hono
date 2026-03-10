import { z } from "zod";

const UserObjectSchema = z.object({
  id: z.string().describe("User ID"),
  email: z.string().email().describe("User email address"),
  name: z.string().nullable().describe("User full name"),
  createdAt: z.string().datetime().describe("User creation date"),
  updatedAt: z.string().datetime().describe("User last update date"),
});

export const UserSchema = {
  CreateUser: z.object({
    email: z.string().email().describe("User email address"),
    name: z.string().optional().describe("User full name"),
  }),

  UpdateUser: z.object({
    name: z.string().optional().describe("User full name"),
  }),

  User: UserObjectSchema,

  UserList: z.object({
    success: z.boolean().describe("Request success status"),
    data: z.array(UserObjectSchema).describe("List of users"),
    message: z.string().optional().describe("Response message"),
    meta: z.object({
      timestamp: z.string().describe("Response timestamp"),
      path: z.string().optional().describe("Request path"),
    }),
  }),

  UserResponse: z.object({
    success: z.boolean().describe("Request success status"),
    data: UserObjectSchema.describe("User data"),
    message: z.string().optional().describe("Response message"),
    meta: z.object({
      timestamp: z.string().describe("Response timestamp"),
      path: z.string().optional().describe("Request path"),
    }),
  }),
};

export type CreateUserInput = z.infer<typeof UserSchema.CreateUser>;
export type UpdateUserInput = z.infer<typeof UserSchema.UpdateUser>;
export type UserResponse = z.infer<typeof UserSchema.UserResponse>;
export type UserListResponse = z.infer<typeof UserSchema.UserList>;

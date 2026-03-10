import { z } from "zod";

export const IdSchema = z.string().min(1, "Valid ID is required");

export const EmailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format");

export const NameSchema = z
  .string()
  .min(1, "Name must be a non-empty string")
  .max(100, "Name must be less than 100 characters")
  .optional();

export const PostTitleSchema = z
  .string()
  .min(1, "Title is required")
  .max(255, "Title must be less than 255 characters");

export const PostContentSchema = z
  .string()
  .max(10000, "Content must be less than 10000 characters")
  .optional();

export const PublishedSchema = z.boolean().optional();

export const PaginationSchema = z.object({
  page: z.number().min(1, "Page must be greater than 0"),
  limit: z
    .number()
    .min(1, "Limit must be greater than 0")
    .max(100, "Limit must be less than or equal to 100"),
});

export const UserCreateSchema = z.object({
  email: EmailSchema,
  name: NameSchema,
});

export const UserUpdateSchema = z.object({
  name: NameSchema,
});

export const PostCreateSchema = z.object({
  title: PostTitleSchema,
  content: PostContentSchema,
  published: PublishedSchema,
  authorId: IdSchema,
});

export const PostUpdateSchema = z.object({
  title: PostTitleSchema.optional(),
  content: PostContentSchema,
  published: PublishedSchema,
});

export const IdParamSchema = z.object({
  id: IdSchema,
});

export const AuthorIdParamSchema = z.object({
  authorId: IdSchema,
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type PostCreateInput = z.infer<typeof PostCreateSchema>;
export type PostUpdateInput = z.infer<typeof PostUpdateSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type AuthorIdParam = z.infer<typeof AuthorIdParamSchema>;

import { z } from 'zod';

const PostObjectSchema = z.object({
  id: z.string().describe('Post ID'),
  title: z.string().describe('Post title'),
  content: z.string().nullable().describe('Post content'),
  published: z.boolean().describe('Post published status'),
  createdAt: z.string().datetime().describe('Post creation date'),
  updatedAt: z.string().datetime().describe('Post last update date'),
  authorId: z.string().describe('Author ID'),
  author: z.object({
    id: z.string().describe('Author ID'),
    email: z.string().email().describe('Author email'),
    name: z.string().nullable().describe('Author name'),
  }).optional().describe('Post author'),
});

export const PostSchema = {
  CreatePost: z.object({
    title: z.string().min(1).describe('Post title'),
    content: z.string().optional().describe('Post content'),
    published: z.boolean().optional().describe('Post published status'),
    authorId: z.string().describe('Author ID'),
  }),
  
  UpdatePost: z.object({
    title: z.string().optional().describe('Post title'),
    content: z.string().optional().describe('Post content'),
    published: z.boolean().optional().describe('Post published status'),
  }),
  
  Post: PostObjectSchema,
  
  PostList: z.object({
    success: z.boolean().describe('Request success status'),
    data: z.array(PostObjectSchema).describe('List of posts'),
    message: z.string().optional().describe('Response message'),
    meta: z.object({
      timestamp: z.string().describe('Response timestamp'),
      path: z.string().optional().describe('Request path'),
    }),
  }),
  
  PostResponse: z.object({
    success: z.boolean().describe('Request success status'),
    data: PostObjectSchema.describe('Post data'),
    message: z.string().optional().describe('Response message'),
    meta: z.object({
      timestamp: z.string().describe('Response timestamp'),
      path: z.string().optional().describe('Request path'),
    }),
  }),
};

export type CreatePostInput = z.infer<typeof PostSchema.CreatePost>;
export type UpdatePostInput = z.infer<typeof PostSchema.UpdatePost>;
export type PostResponse = z.infer<typeof PostSchema.PostResponse>;
export type PostListResponse = z.infer<typeof PostSchema.PostList>;

import { z } from 'zod';

export const CommonSchema = {
  ErrorResponse: z.object({
    success: z.boolean().describe('Request success status'),
    error: z.string().describe('Error message'),
    meta: z.object({
      timestamp: z.string().describe('Response timestamp'),
      path: z.string().optional().describe('Request path'),
    }),
  }),
  
  SuccessResponse: z.object({
    success: z.boolean().describe('Request success status'),
    message: z.string().optional().describe('Response message'),
    meta: z.object({
      timestamp: z.string().describe('Response timestamp'),
      path: z.string().optional().describe('Request path'),
    }),
  }),
  
  PaginationMeta: z.object({
    page: z.number().describe('Current page number'),
    limit: z.number().describe('Items per page'),
    total: z.number().describe('Total number of items'),
    totalPages: z.number().describe('Total number of pages'),
  }),
  
  IdParam: z.object({
    id: z.string().describe('Resource ID'),
  }),
  
  AuthorIdParam: z.object({
    authorId: z.string().describe('Author ID'),
  }),
};

export type ErrorResponse = z.infer<typeof CommonSchema.ErrorResponse>;
export type SuccessResponse = z.infer<typeof CommonSchema.SuccessResponse>;
export type PaginationMeta = z.infer<typeof CommonSchema.PaginationMeta>;

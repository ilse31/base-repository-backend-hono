import { z } from "zod";
import { CreateUserInput, UpdateUserInput } from "@/domain/entities/User";
import { CreatePostInput, UpdatePostInput } from "@/domain/entities/Post";
import {
  IdSchema,
  EmailSchema,
  NameSchema,
  PostTitleSchema,
  PostContentSchema,
  UserCreateSchema,
  UserUpdateSchema,
  PostCreateSchema,
  PostUpdateSchema,
} from "./Schemas";

/**
 * Zod-based validation service with proper error handling
 */
export class ValidationService {
  /**
   * Validate ID parameter
   */
  static validateId(id: string): string {
    return IdSchema.parse(id);
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): string {
    return EmailSchema.parse(email);
  }

  /**
   * Validate name (optional)
   */
  static validateName(name?: string): string | undefined {
    if (name === undefined) return undefined;
    return NameSchema.parse(name);
  }

  /**
   * Validate post title
   */
  static validatePostTitle(title?: string): string | undefined {
    if (title === undefined) return undefined;
    return PostTitleSchema.parse(title);
  }

  /**
   * Validate post content
   */
  static validatePostContent(content?: string): string | undefined {
    if (content === undefined) return undefined;
    return PostContentSchema.parse(content);
  }

  /**
   * Validate complete user creation input.
   * Converts undefined → null for nullable DB fields so the result
   * is assignable to CreateUserInput and compatible with Prisma.
   */
  static validateUserCreate(input: unknown): CreateUserInput {
    const result = UserCreateSchema.parse(input);
    return {
      email: result.email,
      name: result.name ?? null,
    };
  }

  /**
   * Validate user update input.
   * Only includes fields that were explicitly provided so Prisma
   * does not overwrite unrelated columns.
   */
  static validateUserUpdate(input: unknown): UpdateUserInput {
    const result = UserUpdateSchema.parse(input);
    const output: UpdateUserInput = {};
    if (result.name !== undefined) {
      output.name = result.name;
    }
    return output;
  }

  /**
   * Validate complete post creation input.
   * Converts undefined → null for nullable DB fields so the result
   * is assignable to CreatePostInput and compatible with Prisma.
   */
  static validatePostCreate(input: unknown): CreatePostInput {
    const result = PostCreateSchema.parse(input);
    const output: CreatePostInput = {
      title: result.title,
      content: result.content ?? null,
      authorId: result.authorId,
    };
    if (result.published !== undefined) {
      output.published = result.published;
    }
    return output;
  }

  /**
   * Validate post update input.
   * Only includes fields that were explicitly provided so Prisma
   * does not overwrite unrelated columns.
   */
  static validatePostUpdate(input: unknown): UpdatePostInput {
    const result = PostUpdateSchema.parse(input);
    const output: UpdatePostInput = {};
    if (result.title !== undefined) output.title = result.title;
    if (result.content !== undefined) output.content = result.content;
    if (result.published !== undefined) output.published = result.published;
    return output;
  }

  /**
   * Safe validation - returns result instead of throwing
   */
  static safeParse<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
  ):
    | {
        success: true;
        data: T;
      }
    | {
        success: false;
        error: z.ZodError;
      } {
    const result = schema.safeParse(data);
    return result;
  }

  /**
   * Validate and throw formatted error
   */
  static validateAndThrow<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    errorMessage?: string,
  ): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedError = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(
          errorMessage ? `${errorMessage}: ${formattedError}` : formattedError,
        );
      }
      throw error;
    }
  }
}

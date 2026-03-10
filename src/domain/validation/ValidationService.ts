import { z } from "zod";
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
   * Validate complete user creation input
   */
  static validateUserCreate(input: unknown): {
    email: string;
    name?: string | undefined;
  } {
    return UserCreateSchema.parse(input);
  }

  /**
   * Validate user update input
   */
  static validateUserUpdate(input: unknown): {
    name?: string | undefined;
  } {
    return UserUpdateSchema.parse(input);
  }

  /**
   * Validate complete post creation input
   */
  static validatePostCreate(input: unknown): {
    title: string;
    content?: string | undefined;
    published?: boolean | undefined;
    authorId: string;
  } {
    return PostCreateSchema.parse(input);
  }

  /**
   * Validate post update input
   */
  static validatePostUpdate(input: unknown): {
    title?: string | undefined;
    content?: string | undefined;
    published?: boolean | undefined;
  } {
    return PostUpdateSchema.parse(input);
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

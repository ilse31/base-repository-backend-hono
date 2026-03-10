import { ErrorCodes, getStatusCode, getErrorMessage } from "./ErrorCodes";

/**
 * Enhanced API Error with error codes and structured error response
 */
export class ApiError extends Error {
  public readonly code: ErrorCodes;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly path?: string | undefined;

  constructor(
    code: ErrorCodes,
    message?: string,
    details?: any,
    path?: string | undefined,
  ) {
    const defaultMessage = getErrorMessage(code);
    super(message || defaultMessage);

    this.code = code;
    this.statusCode = getStatusCode(code);
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.path = path;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create API error with custom message
   */
  static withMessage(
    code: ErrorCodes,
    message: string,
    details?: any,
    path?: string,
  ): ApiError {
    return new ApiError(code, message, details, path);
  }

  /**
   * Create API error with details
   */
  static withDetails(code: ErrorCodes, details: any, path?: string): ApiError {
    return new ApiError(code, undefined, details, path);
  }

  /**
   * Convert to JSON response format
   */
  toJSON(): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
        path: this.path,
      },
      meta: {
        timestamp: this.timestamp,
        path: this.path,
      },
    };
  }

  /**
   * Check if this is a client error
   */
  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if this is a server error
   */
  get isServerError(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }
}

/**
 * API Error Response Interface
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCodes;
    message: string;
    details?: any;
    timestamp: string;
    path?: string | undefined;
  };
  meta: {
    timestamp: string;
    path?: string | undefined;
  };
}

/**
 * Specific error classes for common scenarios
 */
export class UserNotFoundError extends ApiError {
  constructor(userId?: string, path?: string) {
    super(
      ErrorCodes.USER_NOT_FOUND,
      userId ? `User with ID ${userId} not found` : undefined,
      { userId },
      path,
    );
  }
}

export class UserAlreadyExistsError extends ApiError {
  constructor(email: string, path?: string) {
    super(
      ErrorCodes.USER_ALREADY_EXISTS,
      `User with email ${email} already exists`,
      { email },
      path,
    );
  }
}

export class PostNotFoundError extends ApiError {
  constructor(postId?: string, path?: string) {
    super(
      ErrorCodes.POST_NOT_FOUND,
      postId ? `Post with ID ${postId} not found` : undefined,
      { postId },
      path,
    );
  }
}

export class PostAlreadyExistsError extends ApiError {
  constructor(title?: string, path?: string) {
    super(
      ErrorCodes.POST_ALREADY_EXISTS,
      title ? `Post with title "${title}" already exists` : undefined,
      { title },
      path,
    );
  }
}

export class ValidationError extends ApiError {
  constructor(validationErrors: any, path?: string) {
    super(
      ErrorCodes.VALIDATION_FAILED,
      "Validation failed",
      { validationErrors },
      path,
    );
  }
}

export class DatabaseError extends ApiError {
  constructor(operation: string, details?: any, path?: string) {
    super(
      ErrorCodes.DATABASE_QUERY_FAILED,
      `Database operation failed: ${operation}`,
      { operation, ...details },
      path,
    );
  }
}

export class CacheError extends ApiError {
  constructor(operation: string, key?: string, path?: string) {
    super(
      ErrorCodes.CACHE_OPERATION_FAILED,
      `Cache operation failed: ${operation}`,
      { operation, key },
      path,
    );
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message?: string, path?: string) {
    super(ErrorCodes.UNAUTHORIZED_ACCESS, message, undefined, path);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message?: string, path?: string) {
    super(ErrorCodes.FORBIDDEN_ACCESS, message, undefined, path);
  }
}

export class InternalServerError extends ApiError {
  constructor(message?: string, details?: any, path?: string) {
    super(ErrorCodes.INTERNAL_SERVER_ERROR, message, details, path);
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(service: string, path?: string) {
    super(
      ErrorCodes.SERVICE_UNAVAILABLE,
      `${service} service is temporarily unavailable`,
      { service },
      path,
    );
  }
}

export class RateLimitError extends ApiError {
  constructor(limit: number, windowMs: number, path?: string) {
    super(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      { limit, windowMs },
      path,
    );
  }
}

export class BusinessRuleError extends ApiError {
  constructor(rule: string, message?: string, path?: string) {
    super(
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      message || `Business rule violation: ${rule}`,
      { rule },
      path,
    );
  }
}

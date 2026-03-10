/**
 * Standardized error codes for the API
 * Format: [DOMAIN]_[SPECIFIC_ERROR]
 * Example: USER_NOT_FOUND, POST_ALREADY_EXISTS
 */

export enum ErrorCodes {
  // User Domain Errors (1000-1099)
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_INVALID_EMAIL = 'USER_INVALID_EMAIL',
  USER_INVALID_NAME = 'USER_INVALID_NAME',
  USER_CREATION_FAILED = 'USER_CREATION_FAILED',
  USER_UPDATE_FAILED = 'USER_UPDATE_FAILED',
  USER_DELETE_FAILED = 'USER_DELETE_FAILED',
  
  // Post Domain Errors (1100-1199)
  POST_NOT_FOUND = 'POST_NOT_FOUND',
  POST_ALREADY_EXISTS = 'POST_ALREADY_EXISTS',
  POST_INVALID_TITLE = 'POST_INVALID_TITLE',
  POST_INVALID_CONTENT = 'POST_INVALID_CONTENT',
  POST_INVALID_AUTHOR = 'POST_INVALID_AUTHOR',
  POST_CREATION_FAILED = 'POST_CREATION_FAILED',
  POST_UPDATE_FAILED = 'POST_UPDATE_FAILED',
  POST_DELETE_FAILED = 'POST_DELETE_FAILED',
  
  // Validation Errors (1200-1299)
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT_FORMAT = 'INVALID_INPUT_FORMAT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  
  // Authentication & Authorization Errors (1300-1399)
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  FORBIDDEN_ACCESS = 'FORBIDDEN_ACCESS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Database Errors (1400-1499)
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',
  DATABASE_TIMEOUT = 'DATABASE_TIMEOUT',
  
  // Cache Errors (1500-1599)
  CACHE_CONNECTION_FAILED = 'CACHE_CONNECTION_FAILED',
  CACHE_OPERATION_FAILED = 'CACHE_OPERATION_FAILED',
  CACHE_KEY_NOT_FOUND = 'CACHE_KEY_NOT_FOUND',
  
  // External Service Errors (1600-1699)
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // System Errors (1700-1799)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  
  // Network Errors (1800-1899)
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  REQUEST_TOO_LARGE = 'REQUEST_TOO_LARGE',
  
  // Business Logic Errors (1900-1999)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
}

/**
 * Error code to HTTP status code mapping
 */
export const ERROR_CODE_TO_STATUS: Record<ErrorCodes, number> = {
  // User Errors
  [ErrorCodes.USER_NOT_FOUND]: 404,
  [ErrorCodes.USER_ALREADY_EXISTS]: 409,
  [ErrorCodes.USER_INVALID_EMAIL]: 400,
  [ErrorCodes.USER_INVALID_NAME]: 400,
  [ErrorCodes.USER_CREATION_FAILED]: 500,
  [ErrorCodes.USER_UPDATE_FAILED]: 500,
  [ErrorCodes.USER_DELETE_FAILED]: 500,
  
  // Post Errors
  [ErrorCodes.POST_NOT_FOUND]: 404,
  [ErrorCodes.POST_ALREADY_EXISTS]: 409,
  [ErrorCodes.POST_INVALID_TITLE]: 400,
  [ErrorCodes.POST_INVALID_CONTENT]: 400,
  [ErrorCodes.POST_INVALID_AUTHOR]: 400,
  [ErrorCodes.POST_CREATION_FAILED]: 500,
  [ErrorCodes.POST_UPDATE_FAILED]: 500,
  [ErrorCodes.POST_DELETE_FAILED]: 500,
  
  // Validation Errors
  [ErrorCodes.VALIDATION_FAILED]: 400,
  [ErrorCodes.INVALID_INPUT_FORMAT]: 400,
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCodes.INVALID_PARAMETER]: 400,
  
  // Authentication & Authorization Errors
  [ErrorCodes.UNAUTHORIZED_ACCESS]: 401,
  [ErrorCodes.FORBIDDEN_ACCESS]: 403,
  [ErrorCodes.INVALID_TOKEN]: 401,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  
  // Database Errors
  [ErrorCodes.DATABASE_CONNECTION_FAILED]: 503,
  [ErrorCodes.DATABASE_QUERY_FAILED]: 500,
  [ErrorCodes.DATABASE_CONSTRAINT_VIOLATION]: 400,
  [ErrorCodes.DATABASE_TIMEOUT]: 504,
  
  // Cache Errors
  [ErrorCodes.CACHE_CONNECTION_FAILED]: 503,
  [ErrorCodes.CACHE_OPERATION_FAILED]: 500,
  [ErrorCodes.CACHE_KEY_NOT_FOUND]: 404,
  
  // External Service Errors
  [ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.EXTERNAL_SERVICE_TIMEOUT]: 504,
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 502,
  
  // System Errors
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCodes.MAINTENANCE_MODE]: 503,
  
  // Network Errors
  [ErrorCodes.NETWORK_TIMEOUT]: 408,
  [ErrorCodes.NETWORK_CONNECTION_FAILED]: 503,
  [ErrorCodes.REQUEST_TOO_LARGE]: 413,
  
  // Business Logic Errors
  [ErrorCodes.BUSINESS_RULE_VIOLATION]: 422,
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCodes.RESOURCE_LIMIT_EXCEEDED]: 429,
  [ErrorCodes.OPERATION_NOT_ALLOWED]: 405,
};

/**
 * Error code to default message mapping
 */
export const ERROR_CODE_TO_MESSAGE: Record<ErrorCodes, string> = {
  // User Errors
  [ErrorCodes.USER_NOT_FOUND]: 'User not found',
  [ErrorCodes.USER_ALREADY_EXISTS]: 'User with this email already exists',
  [ErrorCodes.USER_INVALID_EMAIL]: 'Invalid email format',
  [ErrorCodes.USER_INVALID_NAME]: 'Invalid name format',
  [ErrorCodes.USER_CREATION_FAILED]: 'Failed to create user',
  [ErrorCodes.USER_UPDATE_FAILED]: 'Failed to update user',
  [ErrorCodes.USER_DELETE_FAILED]: 'Failed to delete user',
  
  // Post Errors
  [ErrorCodes.POST_NOT_FOUND]: 'Post not found',
  [ErrorCodes.POST_ALREADY_EXISTS]: 'Post with this title already exists',
  [ErrorCodes.POST_INVALID_TITLE]: 'Invalid post title',
  [ErrorCodes.POST_INVALID_CONTENT]: 'Invalid post content',
  [ErrorCodes.POST_INVALID_AUTHOR]: 'Invalid author ID',
  [ErrorCodes.POST_CREATION_FAILED]: 'Failed to create post',
  [ErrorCodes.POST_UPDATE_FAILED]: 'Failed to update post',
  [ErrorCodes.POST_DELETE_FAILED]: 'Failed to delete post',
  
  // Validation Errors
  [ErrorCodes.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCodes.INVALID_INPUT_FORMAT]: 'Invalid input format',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Missing required field',
  [ErrorCodes.INVALID_PARAMETER]: 'Invalid parameter',
  
  // Authentication & Authorization Errors
  [ErrorCodes.UNAUTHORIZED_ACCESS]: 'Unauthorized access',
  [ErrorCodes.FORBIDDEN_ACCESS]: 'Forbidden access',
  [ErrorCodes.INVALID_TOKEN]: 'Invalid authentication token',
  [ErrorCodes.TOKEN_EXPIRED]: 'Authentication token expired',
  
  // Database Errors
  [ErrorCodes.DATABASE_CONNECTION_FAILED]: 'Database connection failed',
  [ErrorCodes.DATABASE_QUERY_FAILED]: 'Database query failed',
  [ErrorCodes.DATABASE_CONSTRAINT_VIOLATION]: 'Database constraint violation',
  [ErrorCodes.DATABASE_TIMEOUT]: 'Database operation timeout',
  
  // Cache Errors
  [ErrorCodes.CACHE_CONNECTION_FAILED]: 'Cache connection failed',
  [ErrorCodes.CACHE_OPERATION_FAILED]: 'Cache operation failed',
  [ErrorCodes.CACHE_KEY_NOT_FOUND]: 'Cache key not found',
  
  // External Service Errors
  [ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE]: 'External service unavailable',
  [ErrorCodes.EXTERNAL_SERVICE_TIMEOUT]: 'External service timeout',
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service error',
  
  // System Errors
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCodes.MAINTENANCE_MODE]: 'System under maintenance',
  
  // Network Errors
  [ErrorCodes.NETWORK_TIMEOUT]: 'Network timeout',
  [ErrorCodes.NETWORK_CONNECTION_FAILED]: 'Network connection failed',
  [ErrorCodes.REQUEST_TOO_LARGE]: 'Request too large',
  
  // Business Logic Errors
  [ErrorCodes.BUSINESS_RULE_VIOLATION]: 'Business rule violation',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [ErrorCodes.RESOURCE_LIMIT_EXCEEDED]: 'Resource limit exceeded',
  [ErrorCodes.OPERATION_NOT_ALLOWED]: 'Operation not allowed',
};

/**
 * Get HTTP status code for error code
 */
export function getStatusCode(errorCode: ErrorCodes): number {
  return ERROR_CODE_TO_STATUS[errorCode] || 500;
}

/**
 * Get default message for error code
 */
export function getErrorMessage(errorCode: ErrorCodes): string {
  return ERROR_CODE_TO_MESSAGE[errorCode] || 'Unknown error';
}

/**
 * Check if error code is client error (4xx)
 */
export function isClientError(errorCode: ErrorCodes): boolean {
  const statusCode = getStatusCode(errorCode);
  return statusCode >= 400 && statusCode < 500;
}

/**
 * Check if error code is server error (5xx)
 */
export function isServerError(errorCode: ErrorCodes): boolean {
  const statusCode = getStatusCode(errorCode);
  return statusCode >= 500 && statusCode < 600;
}

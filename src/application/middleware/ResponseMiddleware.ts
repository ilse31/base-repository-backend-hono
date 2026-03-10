import { Context } from "hono";
import { ApiResponse, ResponseBuilder } from "../responses/BaseResponse";
import { ApiError } from "../errors/ApiError";

export class ResponseMiddleware {
  static sendSuccess<T>(
    c: Context,
    data: T,
    message?: string,
    status = 200 as const,
  ) {
    const response = ResponseBuilder.success(data, message);
    response.meta!.path = c.req.path;
    return c.json(response, status);
  }

  static sendCreated<T>(c: Context, data: T, message?: string) {
    const response = ResponseBuilder.created(data, message);
    response.meta!.path = c.req.path;
    return c.json(response, 201 as const);
  }

  static sendUpdated<T>(c: Context, data: T, message?: string) {
    const response = ResponseBuilder.updated(data, message);
    response.meta!.path = c.req.path;
    return c.json(response, 200 as const);
  }

  static sendDeleted(c: Context, message?: string) {
    const response = ResponseBuilder.deleted(message);
    response.meta!.path = c.req.path;
    return c.json(response, 200 as const);
  }

  static sendError(
    c: Context,
    error: string | ApiError,
    status?: 400 | 404 | 500,
  ) {
    if (error instanceof ApiError) {
      const errorResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: error.timestamp,
          path: c.req.path,
        },
        meta: {
          timestamp: error.timestamp,
          path: c.req.path,
        },
      };
      return c.json(errorResponse, error.statusCode as any);
    }

    const response = ResponseBuilder.error(error);
    response.meta!.path = c.req.path;
    return c.json(response, status || 400);
  }

  /**
   * Send ApiError response
   */
  static sendApiError(c: Context, apiError: ApiError) {
    const errorResponse = {
      success: false,
      error: {
        code: apiError.code,
        message: apiError.message,
        details: apiError.details,
        timestamp: apiError.timestamp,
        path: c.req.path,
      },
      meta: {
        timestamp: apiError.timestamp,
        path: c.req.path,
      },
    };
    return c.json(errorResponse, apiError.statusCode as any);
  }

  static sendPaginated<T>(
    c: Context,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
  ) {
    const response = ResponseBuilder.paginated(
      data,
      page,
      limit,
      total,
      message,
    );
    response.meta!.path = c.req.path;
    return c.json(response, 200 as const);
  }
}

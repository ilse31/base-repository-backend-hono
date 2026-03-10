export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string | undefined;
  meta?: {
    timestamp: string;
    path?: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ApiResponse["meta"] & {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class ResponseBuilder {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static error(error: string, statusCode?: number): ApiResponse {
    return {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static created<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || "Resource created successfully",
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static updated<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || "Resource updated successfully",
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static deleted(message?: string): ApiResponse {
    return {
      success: true,
      message: message || "Resource deleted successfully",
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
  ): PaginatedResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }
}

import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { JwtService } from "@/infrastructure/auth/JwtService";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/application/errors/ApiError";

export interface AuthenticatedUserContext {
  user: {
    id: string;
    email: string;
  };
}

export class AuthMiddleware {
  private static readonly ACCESS_COOKIE_NAME = "accessToken";

  private static getJwtService(): JwtService {
    return new JwtService();
  }

  private static extractBearerToken(
    authorizationHeader?: string | null,
  ): string | null {
    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return null;
    }

    return token;
  }

  private static extractAccessToken(c: Context): string | null {
    const bearerToken = this.extractBearerToken(c.req.header("Authorization"));
    if (bearerToken) {
      return bearerToken;
    }

    const cookieToken = getCookie(c, this.ACCESS_COOKIE_NAME);
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }

  static requireAuth() {
    return async (c: Context, next: Next) => {
      const token = this.extractAccessToken(c);

      if (!token) {
        throw new UnauthorizedError(
          "Authentication required. Provide a bearer token or access token cookie.",
          c.req.path,
        );
      }

      try {
        const payload = await this.getJwtService().verifyAccessToken(token);

        c.set("auth", {
          user: {
            id: payload.sub,
            email: payload.email,
          },
        } as AuthenticatedUserContext);

        await next();
      } catch {
        throw new UnauthorizedError(
          "Invalid or expired access token",
          c.req.path,
        );
      }
    };
  }

  static requireOwnership(
    getResourceUserId: (c: Context) => Promise<string | null>,
  ) {
    return async (c: Context, next: Next) => {
      const auth = c.get("auth") as AuthenticatedUserContext | undefined;

      if (!auth) {
        throw new UnauthorizedError(
          "Authentication context is missing",
          c.req.path,
        );
      }

      const resourceUserId = await getResourceUserId(c);

      if (!resourceUserId) {
        throw new ForbiddenError(
          "You do not have access to this resource",
          c.req.path,
        );
      }

      if (auth.user.id !== resourceUserId) {
        throw new ForbiddenError(
          "You are not allowed to access this resource",
          c.req.path,
        );
      }

      await next();
    };
  }

  static optionalAuth() {
    return async (c: Context, next: Next) => {
      const token = this.extractAccessToken(c);

      if (!token) {
        await next();
        return;
      }

      try {
        const payload = await this.getJwtService().verifyAccessToken(token);

        c.set("auth", {
          user: {
            id: payload.sub,
            email: payload.email,
          },
        } as AuthenticatedUserContext);
      } catch {
        // Ignore invalid optional auth tokens and continue as unauthenticated.
      }

      await next();
    };
  }
}

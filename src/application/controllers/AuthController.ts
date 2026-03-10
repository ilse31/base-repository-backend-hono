import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { AuthService } from "@/domain/services/AuthService";
import { ResponseMiddleware } from "@/application/middleware/ResponseMiddleware";
import { AuthMiddleware } from "@/application/middleware/AuthMiddleware";
import { ApiError } from "@/application/errors/ApiError";
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/application/schemas/AuthSchema";
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/domain/entities/Auth";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
};

export class AuthController {
  public router = new Hono();

  private static readonly ACCESS_COOKIE_NAME = "accessToken";
  private static readonly REFRESH_COOKIE_NAME = "refreshToken";

  constructor(private authService: AuthService) {
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post(
      "/register",
      zValidator("json", RegisterSchema),
      this.register.bind(this),
    );

    this.router.post(
      "/login",
      zValidator("json", LoginSchema),
      this.login.bind(this),
    );

    this.router.post(
      "/refresh",
      zValidator("json", RefreshTokenSchema),
      this.refreshToken.bind(this),
    );

    this.router.get(
      "/me",
      AuthMiddleware.requireAuth(),
      this.getCurrentUser.bind(this),
    );

    this.router.post("/logout", this.logout.bind(this));

    this.router.post(
      "/forgot-password",
      zValidator("json", ForgotPasswordSchema),
      this.forgotPassword.bind(this),
    );

    this.router.post(
      "/reset-password",
      zValidator("json", ResetPasswordSchema),
      this.resetPassword.bind(this),
    );
  }

  private isMobileClient(c: any): boolean {
    const clientType = c.req.header("x-client-type");
    return clientType?.trim().toLowerCase() === "mobile";
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  }

  private setAuthCookies(c: any, tokens: AuthTokens): void {
    const secure = this.isProduction();

    setCookie(c, AuthController.ACCESS_COOKIE_NAME, tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "Lax",
      path: "/",
      maxAge: tokens.accessTokenExpiresIn,
    });

    setCookie(c, AuthController.REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "Strict",
      path: "/api/auth/refresh",
      maxAge: tokens.refreshTokenExpiresIn,
    });
  }

  private clearAuthCookies(c: any): void {
    deleteCookie(c, AuthController.ACCESS_COOKIE_NAME, {
      path: "/",
    });

    deleteCookie(c, AuthController.REFRESH_COOKIE_NAME, {
      path: "/api/auth/refresh",
    });
  }

  private buildAuthResponse(
    c: any,
    payload: {
      user: unknown;
      tokens: AuthTokens;
    },
    message: string,
    status: "created" | "success" = "success",
  ) {
    const mobile = this.isMobileClient(c);

    if (!mobile) {
      this.setAuthCookies(c, payload.tokens);
    }

    const responseData = mobile
      ? {
          user: payload.user,
          tokens: payload.tokens,
        }
      : {
          user: payload.user,
        };

    if (status === "created") {
      return ResponseMiddleware.sendCreated(c, responseData, message);
    }

    return ResponseMiddleware.sendSuccess(c, responseData, message);
  }

  private getRefreshTokenFromRequest(
    c: any,
    body?: Partial<RefreshTokenInput>,
  ): string | null {
    const fromBody = body?.refreshToken;
    if (fromBody) {
      return fromBody;
    }

    const fromCookie = getCookie(c, AuthController.REFRESH_COOKIE_NAME);
    if (fromCookie) {
      return fromCookie;
    }

    return null;
  }

  private async register(c: any) {
    try {
      const input = c.req.valid("json") as RegisterInput;
      const result = await this.authService.register(input);

      return this.buildAuthResponse(
        c,
        {
          user: result.user,
          tokens: result.tokens,
        },
        "User registered successfully",
        "created",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }

  private async login(c: any) {
    try {
      const input = c.req.valid("json") as LoginInput;
      const result = await this.authService.login(input);

      return this.buildAuthResponse(
        c,
        {
          user: result.user,
          tokens: result.tokens,
        },
        "Login successful",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }

  private async refreshToken(c: any) {
    try {
      const body = c.req.valid("json") as Partial<RefreshTokenInput>;
      const refreshToken = this.getRefreshTokenFromRequest(c, body);

      if (!refreshToken) {
        return ResponseMiddleware.sendError(
          c,
          "Refresh token is required",
          400,
        );
      }

      const result = await this.authService.refresh({ refreshToken });

      return this.buildAuthResponse(
        c,
        {
          user: result.user,
          tokens: result.tokens,
        },
        "Token refreshed successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }

  private async getCurrentUser(c: any) {
    try {
      const auth = c.get("auth") as {
        user: {
          id: string;
        };
      };

      const user = await this.authService.getCurrentUser(auth.user.id);

      return ResponseMiddleware.sendSuccess(
        c,
        {
          user,
        },
        "Current user retrieved successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }

  private async logout(c: any) {
    try {
      const refreshToken = this.getRefreshTokenFromRequest(c);

      await this.authService.logout(refreshToken ?? undefined);
      this.clearAuthCookies(c);

      return ResponseMiddleware.sendSuccess(c, null, "Logout successful");
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }

  private async forgotPassword(c: any) {
    try {
      const input = c.req.valid("json") as ForgotPasswordInput;
      await this.authService.forgotPassword(input);

      return ResponseMiddleware.sendSuccess(
        c,
        null,
        "If the account exists, a password reset link has been sent",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }

  private async resetPassword(c: any) {
    try {
      const input = c.req.valid("json") as ResetPasswordInput;

      await this.authService.resetPassword({
        token: input.token,
        newPassword: input.newPassword,
      });

      this.clearAuthCookies(c);

      return ResponseMiddleware.sendSuccess(
        c,
        null,
        "Password reset successful",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }
}

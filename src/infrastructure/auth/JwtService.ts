import { sign, verify } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  type: "access";
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  tokenId: string;
  type: "refresh";
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export class JwtService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresIn: number;

  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";
    this.accessTokenExpiresIn = parseInt(
      process.env.JWT_ACCESS_EXPIRES_IN_SECONDS || "900",
      10,
    );
    this.refreshTokenExpiresIn = parseInt(
      process.env.JWT_REFRESH_EXPIRES_IN_SECONDS || "604800",
      10,
    );
  }

  async generateAccessToken(user: {
    id: string;
    email: string;
  }): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      type: "access",
      iat: now,
      exp: now + this.accessTokenExpiresIn,
    };

    return sign(payload, this.accessSecret, "HS256");
  }

  async generateRefreshToken(
    user: {
      id: string;
      email: string;
    },
    tokenId: string,
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const payload: RefreshTokenPayload = {
      sub: user.id,
      email: user.email,
      tokenId,
      type: "refresh",
      iat: now,
      exp: now + this.refreshTokenExpiresIn,
    };

    return sign(payload, this.refreshSecret, "HS256");
  }

  async generateTokenPair(
    user: {
      id: string;
      email: string;
    },
    tokenId: string,
  ): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user, tokenId),
    ]);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.accessTokenExpiresIn,
      refreshTokenExpiresIn: this.refreshTokenExpiresIn,
    };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const payload = await verify(token, this.accessSecret, "HS256");

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      payload.type !== "access"
    ) {
      throw new Error("Invalid access token");
    }

    return payload as AccessTokenPayload;
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const payload = await verify(token, this.refreshSecret, "HS256");

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.tokenId !== "string" ||
      payload.type !== "refresh"
    ) {
      throw new Error("Invalid refresh token");
    }

    return payload as RefreshTokenPayload;
  }

  getAccessTokenExpiresIn(): number {
    return this.accessTokenExpiresIn;
  }

  getRefreshTokenExpiresIn(): number {
    return this.refreshTokenExpiresIn;
  }

  getAccessTokenExpiryDate(): Date {
    return new Date(Date.now() + this.accessTokenExpiresIn * 1000);
  }

  getRefreshTokenExpiryDate(): Date {
    return new Date(Date.now() + this.refreshTokenExpiresIn * 1000);
  }
}

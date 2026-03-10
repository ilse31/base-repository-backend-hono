import { User } from "@/domain/entities/User";

export interface AuthUser extends User {
  passwordHash: string;
}

export interface CreateAuthUserInput {
  email: string;
  name?: string | null;
  passwordHash: string;
}

export interface RefreshTokenRecord {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface PasswordResetTokenRecord {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface IAuthRepository {
  createUser(input: CreateAuthUserInput): Promise<User>;
  findUserByEmailWithPassword(email: string): Promise<AuthUser | null>;
  findUserById(userId: string): Promise<User | null>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;

  createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshTokenRecord>;
  findRefreshToken(token: string): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeAllUserRefreshTokens(userId: string): Promise<void>;

  createPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetTokenRecord>;
  findPasswordResetToken(
    token: string,
  ): Promise<PasswordResetTokenRecord | null>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;
}

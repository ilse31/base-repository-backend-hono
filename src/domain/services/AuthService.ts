import { randomBytes, randomUUID } from "crypto";
import {
  ApiError,
  DatabaseError,
  UnauthorizedError,
  UserAlreadyExistsError,
  UserNotFoundError,
  ValidationError,
} from "@/application/errors/ApiError";
import {
  AuthResponse,
  AuthUser,
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
  TokenPair,
} from "@/domain/entities/Auth";
import { IAuthRepository } from "@/domain/repositories/AuthRepository";
import { EmailService } from "@/infrastructure/email/EmailService";
import { JwtService } from "@/infrastructure/auth/JwtService";
import { PasswordService } from "@/infrastructure/auth/PasswordService";

export class AuthService {
  constructor(
    private authRepository: IAuthRepository,
    private jwtService: JwtService,
    private emailService: EmailService = EmailService.getInstance(),
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedName = input.name?.trim() ?? null;

    const existingUser =
      await this.authRepository.findUserByEmailWithPassword(normalizedEmail);

    if (existingUser) {
      throw new UserAlreadyExistsError(normalizedEmail, "register");
    }

    const passwordValidation = PasswordService.validatePasswordStrength(
      input.password,
    );
    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.errors, "register");
    }

    const passwordHash = PasswordService.hashPassword(input.password);

    try {
      const user = await this.authRepository.createUser({
        email: normalizedEmail,
        name: normalizedName,
        passwordHash,
      });

      const tokens = await this.issueTokens(user);

      const displayName = user.name ?? user.email.split("@")[0] ?? "User";
      void this.emailService.sendWelcomeEmail(user.email, displayName);

      return {
        user: this.toAuthUser(user),
        tokens,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new DatabaseError(
        "register",
        { email: normalizedEmail },
        "register",
      );
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user =
      await this.authRepository.findUserByEmailWithPassword(normalizedEmail);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password", "login");
    }

    const isValidPassword = PasswordService.verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password", "login");
    }

    const safeUser = this.toAuthUser(user);
    const tokens = await this.issueTokens(safeUser);

    return {
      user: safeUser,
      tokens,
    };
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new UserNotFoundError(userId, "getCurrentUser");
    }

    return this.toAuthUser(user);
  }

  async refresh(input: RefreshTokenInput): Promise<AuthResponse> {
    let payload;

    try {
      payload = await this.jwtService.verifyRefreshToken(input.refreshToken);
    } catch (error) {
      throw new UnauthorizedError(
        "Invalid or expired refresh token",
        "refresh",
      );
    }

    const storedToken = await this.authRepository.findRefreshToken(
      input.refreshToken,
    );

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedError(
        "Refresh token is no longer valid",
        "refresh",
      );
    }

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      await this.authRepository.revokeRefreshToken(input.refreshToken);
      throw new UnauthorizedError("Refresh token has expired", "refresh");
    }

    if (storedToken.userId !== payload.sub) {
      await this.authRepository.revokeRefreshToken(input.refreshToken);
      throw new UnauthorizedError("Refresh token is invalid", "refresh");
    }

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user) {
      await this.authRepository.revokeRefreshToken(input.refreshToken);
      throw new UserNotFoundError(payload.sub, "refresh");
    }

    await this.authRepository.revokeRefreshToken(input.refreshToken);

    const tokens = await this.issueTokens(user);

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      await this.authRepository.revokeRefreshToken(refreshToken);
    } catch (error) {
      throw new DatabaseError("logout", undefined, "logout");
    }
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user =
      await this.authRepository.findUserByEmailWithPassword(normalizedEmail);

    if (!user) {
      return;
    }

    const resetToken = this.generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    try {
      await this.authRepository.deleteExpiredPasswordResetTokens();
      await this.authRepository.createPasswordResetToken(
        user.id,
        resetToken,
        expiresAt,
      );

      void this.emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      throw new DatabaseError(
        "forgotPassword",
        { email: normalizedEmail },
        "forgotPassword",
      );
    }
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const passwordValidation = PasswordService.validatePasswordStrength(
      input.newPassword,
    );
    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.errors, "resetPassword");
    }

    const resetTokenRecord = await this.authRepository.findPasswordResetToken(
      input.token,
    );

    if (!resetTokenRecord) {
      throw new UnauthorizedError("Invalid reset token", "resetPassword");
    }

    if (resetTokenRecord.usedAt) {
      throw new UnauthorizedError(
        "Reset token has already been used",
        "resetPassword",
      );
    }

    if (resetTokenRecord.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError("Reset token has expired", "resetPassword");
    }

    const user = await this.authRepository.findUserById(
      resetTokenRecord.userId,
    );
    if (!user) {
      throw new UserNotFoundError(resetTokenRecord.userId, "resetPassword");
    }

    const passwordHash = PasswordService.hashPassword(input.newPassword);

    try {
      await this.authRepository.updateUserPassword(user.id, passwordHash);
      await this.authRepository.markPasswordResetTokenUsed(input.token);
      await this.authRepository.revokeAllUserRefreshTokens(user.id);
    } catch (error) {
      throw new DatabaseError(
        "resetPassword",
        { userId: user.id },
        "resetPassword",
      );
    }
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<TokenPair> {
    const tokenId = randomUUID();
    const tokens = await this.jwtService.generateTokenPair(
      { id: user.id, email: user.email },
      tokenId,
    );

    const expiresAt = this.jwtService.getRefreshTokenExpiryDate();

    await this.authRepository.createRefreshToken(
      user.id,
      tokens.refreshToken,
      expiresAt,
    );

    return tokens;
  }

  private generateOpaqueToken(): string {
    return randomBytes(32).toString("hex");
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

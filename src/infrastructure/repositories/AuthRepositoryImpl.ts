import { PrismaService } from "@/infrastructure/database/prisma";
import {
  IAuthRepository,
  AuthUser,
  CreateAuthUserInput,
  RefreshTokenRecord,
  PasswordResetTokenRecord,
} from "@/domain/repositories/AuthRepository";
import { User } from "@/domain/entities/User";

export class AuthRepositoryImpl implements IAuthRepository {
  private prisma = PrismaService.getInstance().getPrisma();

  async createUser(input: CreateAuthUserInput): Promise<User> {
    const data: {
      email: string;
      passwordHash: string;
      name?: string | null;
    } = {
      email: input.email,
      passwordHash: input.passwordHash,
    };

    if (input.name !== undefined) {
      data.name = input.name;
    }

    const user = await this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findUserByEmailWithPassword(email: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findUserById(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async updateUserPassword(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshTokenRecord> {
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
      select: {
        id: true,
        token: true,
        userId: true,
        expiresAt: true,
        createdAt: true,
        revokedAt: true,
      },
    });

    return refreshToken;
  }

  async findRefreshToken(token: string): Promise<RefreshTokenRecord | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        userId: true,
        expiresAt: true,
        createdAt: true,
        revokedAt: true,
      },
    });

    return refreshToken;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        token,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async createPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetTokenRecord> {
    const resetToken = await this.prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
      select: {
        id: true,
        token: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true,
      },
    });

    return resetToken;
  }

  async findPasswordResetToken(
    token: string,
  ): Promise<PasswordResetTokenRecord | null> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true,
      },
    });

    return resetToken;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: {
        token,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lte: new Date(),
            },
          },
          {
            usedAt: {
              not: null,
            },
          },
        ],
      },
    });
  }
}

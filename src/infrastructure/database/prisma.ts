import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export class PrismaService {
  private static instance: PrismaService;
  private prisma: PrismaClient;

  private constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(pool);

    this.prisma = new PrismaClient({
      adapter,
      log: ["query", "info", "warn", "error"],
    });
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

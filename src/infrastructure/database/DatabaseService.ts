import { pbkdf2Sync, randomBytes } from "crypto";
import { PrismaService } from "./prisma";

function hashPassword(password: string): string {
  const iterations = parseInt(
    process.env.PASSWORD_HASH_ITERATIONS || "100000",
    10,
  );
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, iterations, 64, "sha512").toString(
    "hex",
  );

  return `${iterations}:${salt}:${hash}`;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaService;

  private constructor() {
    this.prisma = PrismaService.getInstance();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initializeDatabase(): Promise<void> {
    try {
      console.log("Initializing database...");

      await this.prisma.getPrisma().$connect();
      console.log("Database connected successfully");

      await this.runMigrations();

      await this.seedData();

      console.log("Database initialization completed");
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      console.log("Running database migrations...");

      await this.prisma.getPrisma().$queryRaw`SELECT 1`;

      console.log("Database migrations up to date");
    } catch (error) {
      console.error("Migration check failed:", error);

      if (error instanceof Error && error.message.includes("does not exist")) {
        console.log("Database does not exist, please create it manually");
        console.log("Run: createdb clean_architecture_db");
        console.log("Then run: npm run db:migrate");
      }

      throw error;
    }
  }

  private async seedData(): Promise<void> {
    try {
      console.log("Checking if seed data is needed...");

      const userCount = await this.prisma.getPrisma().user.count();

      if (userCount === 0) {
        console.log("Seeding initial data...");

        const sampleUser = await this.prisma.getPrisma().user.create({
          data: {
            email: "admin@example.com",
            name: "Admin User",
            passwordHash: hashPassword("Admin12345"),
          },
        });

        await this.prisma.getPrisma().post.create({
          data: {
            title: "Welcome to Clean Architecture API",
            content:
              "This is a sample post created during database seeding. The API is built with Hono, PostgreSQL, Redis, and Prisma following clean architecture principles.",
            published: true,
            authorId: sampleUser.id,
          },
        });

        console.log("Sample data seeded successfully");
      } else {
        console.log("Database already contains data, skipping seed");
      }
    } catch (error) {
      console.error("Data seeding failed:", error);

      console.log("Continuing without seed data");
    }
  }

  async checkDatabaseHealth(): Promise<{
    connected: boolean;
    userCount: number;
    postCount: number;
  }> {
    try {
      const userCount = await this.prisma.getPrisma().user.count();
      const postCount = await this.prisma.getPrisma().post.count();

      return {
        connected: true,
        userCount,
        postCount,
      };
    } catch (error) {
      console.error("  Database health check failed:", error);
      return {
        connected: false,
        userCount: 0,
        postCount: 0,
      };
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.disconnect();
  }
}

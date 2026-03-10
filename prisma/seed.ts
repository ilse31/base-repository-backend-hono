import { PrismaClient } from "@prisma/client";
import { pbkdf2Sync, randomBytes } from "crypto";

const prisma = new PrismaClient();

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

async function main() {
  console.log("Starting database seeding...");

  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = hashPassword("Admin12345");
  const userPassword = hashPassword("User12345");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      name: "Admin User",
      passwordHash: adminPassword,
    },
    create: {
      email: "admin@example.com",
      name: "Admin User",
      passwordHash: adminPassword,
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {
      name: "Regular User",
      passwordHash: userPassword,
    },
    create: {
      email: "user@example.com",
      name: "Regular User",
      passwordHash: userPassword,
    },
  });

  console.log("Sample users created");
  console.log("Login credentials:");
  console.log("  admin@example.com / Admin12345");
  console.log("  user@example.com / User12345");

  await prisma.post.upsert({
    where: { id: "sample-post-1" },
    update: {},
    create: {
      id: "sample-post-1",
      title: "Welcome to Clean Architecture API",
      content:
        "This is a comprehensive backend API built with clean architecture principles. It uses Hono as the web framework, PostgreSQL for data persistence, Redis for caching, Prisma as the ORM, and now includes JWT-based authentication.",
      published: true,
      authorId: adminUser.id,
    },
  });

  await prisma.post.upsert({
    where: { id: "sample-post-2" },
    update: {},
    create: {
      id: "sample-post-2",
      title: "Getting Started with Authentication",
      content:
        "To get started, register via /api/auth/register or log in via /api/auth/login. Web clients receive HttpOnly cookies by default, while mobile clients can send the x-client-type: mobile header to receive tokens in the response body.",
      published: true,
      authorId: adminUser.id,
    },
  });

  await prisma.post.upsert({
    where: { id: "sample-post-3" },
    update: {},
    create: {
      id: "sample-post-3",
      title: "Refresh Tokens and Password Reset",
      content:
        "This API supports refresh token rotation and password reset flows. Refresh tokens are persisted for revocation support, and reset tokens expire automatically for better security.",
      published: false,
      authorId: regularUser.id,
    },
  });

  console.log("Sample posts created");

  const userCount = await prisma.user.count();
  const postCount = await prisma.post.count();
  const refreshTokenCount = await prisma.refreshToken.count();
  const passwordResetTokenCount = await prisma.passwordResetToken.count();

  console.log("Database seeded successfully!");
  console.log(`   - Users: ${userCount}`);
  console.log(`   - Posts: ${postCount}`);
  console.log(`   - Refresh Tokens: ${refreshTokenCount}`);
  console.log(`   - Password Reset Tokens: ${passwordResetTokenCount}`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

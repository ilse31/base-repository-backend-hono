import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Regular User",
    },
  });

  console.log("Sample users created");

  // Create sample posts
  await prisma.post.upsert({
    where: { id: "sample-post-1" },
    update: {},
    create: {
      id: "sample-post-1",
      title: "Welcome to Clean Architecture API",
      content:
        "This is a comprehensive backend API built with clean architecture principles. It uses Hono as the web framework, PostgreSQL for data persistence, Redis for caching, and Prisma as the ORM.",
      published: true,
      authorId: adminUser.id,
    },
  });

  await prisma.post.upsert({
    where: { id: "sample-post-2" },
    update: {},
    create: {
      id: "sample-post-2",
      title: "Getting Started with the API",
      content:
        "To get started with this API, you can explore the Swagger documentation at /swagger endpoint. The API provides full CRUD operations for users and posts with proper validation and error handling.",
      published: true,
      authorId: adminUser.id,
    },
  });

  await prisma.post.upsert({
    where: { id: "sample-post-3" },
    update: {},
    create: {
      id: "sample-post-3",
      title: "Clean Architecture Benefits",
      content:
        "Clean architecture provides several benefits including better testability, maintainability, and separation of concerns. This API demonstrates these principles through its layered structure.",
      published: false,
      authorId: regularUser.id,
    },
  });

  console.log("Sample posts created");

  // Display statistics
  const userCount = await prisma.user.count();
  const postCount = await prisma.post.count();

  console.log(`Database seeded successfully!`);
  console.log(`   - Users: ${userCount}`);
  console.log(`   - Posts: ${postCount}`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

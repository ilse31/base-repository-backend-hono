import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { DIContainer } from "@/infrastructure/di/container";
import { PrismaService } from "@/infrastructure/database/prisma";
import { DatabaseService } from "@/infrastructure/database/DatabaseService";
import { RedisClient } from "@/infrastructure/redis";
import { ResponseMiddleware } from "@/application/middleware/ResponseMiddleware";
import { createSwaggerApp } from "@/application/swagger/SwaggerConfig";
import { JobQueue } from "@/infrastructure/queue/JobQueue";
import { CronService } from "@/infrastructure/cron/CronService";
import { ScheduledJobs } from "@/infrastructure/jobs/ScheduledJobs";
import {
  initOpenTelemetry,
  otelConfig,
} from "@/infrastructure/telemetry/tracing";
import {
  WelcomeEmailJob,
  PasswordResetEmailJob,
  PostPublishedEmailJob,
  CustomEmailJob,
} from "@/infrastructure/jobs/EmailJobs";
import { EmailController } from "@/application/controllers/EmailController";
import { AuthController } from "@/application/controllers/AuthController";

const app = new Hono();
const container = DIContainer.getInstance();

async function initializeApp() {
  try {
    console.log("Initializing OpenTelemetry...");
    initOpenTelemetry();

    console.log("Initializing database...");
    await DatabaseService.getInstance().initializeDatabase();

    const dbHealth = await DatabaseService.getInstance().checkDatabaseHealth();
    if (dbHealth.connected) {
      console.log(
        ` Database ready (Users: ${dbHealth.userCount}, Posts: ${dbHealth.postCount})`,
      );
    } else {
      console.log("  Database health check failed");
    }

    console.log("  Initializing Redis...");
    await RedisClient.getInstance().connect();

    const redisHealth = await RedisClient.getInstance().healthCheck();
    if (redisHealth.connected) {
      console.log(`  Redis ready (latency: ${redisHealth.latency}ms)`);
    } else {
      console.log("  Redis health check failed, but connection established");
    }

    console.log("  Initializing background jobs...");
    const jobQueue = JobQueue.getInstance();

    jobQueue.registerJob(new WelcomeEmailJob());
    jobQueue.registerJob(new PasswordResetEmailJob());
    jobQueue.registerJob(new PostPublishedEmailJob());
    jobQueue.registerJob(new CustomEmailJob());

    const queueInterval = parseInt(process.env.JOB_QUEUE_INTERVAL || "5000");
    await jobQueue.startProcessing(queueInterval);

    if (process.env.ENABLE_CRON_JOBS !== "false") {
      console.log("  Initializing cron jobs...");
      const scheduledJobs = ScheduledJobs.getInstance();
      scheduledJobs.registerAllJobs();
      await scheduledJobs.start();
    }

    console.log("  All background services initialized");
  } catch (error) {
    console.warn("  Initialization failed:", error);
    console.log(
      "  Database setup: Make sure PostgreSQL is running and database exists",
    );
    console.log("  Redis setup: Make sure Redis is running on localhost:6379");
    console.log("  Email setup: Configure SMTP settings in .env file");
    console.log(
      "  Install Redis: brew install redis || apt-get install redis-server",
    );

    console.log("🚀 Starting application anyway (some features may not work)");
  }
}

app.use("*", cors());
app.use("*", logger());

app.get("/", (c) => {
  return ResponseMiddleware.sendSuccess(
    c,
    {
      message: "Clean Architecture Backend API",
      version: "1.0.0",
      endpoints: {
        users: "/api/users",
        posts: "/api/posts",
        swagger: "/swagger",
        api_docs: "/doc",
        jaeger: otelConfig.enabled ? "http://localhost:16686" : "disabled",
      },
    },
    "Welcome to Clean Architecture API",
  );
});

const swaggerApp = createSwaggerApp();
app.route("/swagger", swaggerApp);
app.route("/doc", swaggerApp);

app.route("/api/auth", container.getAuthController().router);
app.route("/api/users", container.getUserController().router);
app.route("/api/posts", container.getPostController().router);
app.route("/api/emails", new EmailController().router);

app.onError((err, c) => {
  console.error(err);
  return ResponseMiddleware.sendError(c, "Internal server error", 500);
});

app.notFound((c) => {
  return ResponseMiddleware.sendError(c, "Endpoint not found", 404);
});

const port = Number(process.env.PORT) || 3000;

async function gracefulShutdown() {
  console.log("  Shutting down gracefully...");

  try {
    await DatabaseService.getInstance().disconnect();
    console.log("  Database disconnected");
  } catch (error) {
    console.error("  Error disconnecting database:", error);
  }

  try {
    await RedisClient.getInstance().disconnect();
    console.log("  Redis disconnected");
  } catch (error) {
    console.error("  Error disconnecting Redis:", error);
  }

  try {
    await JobQueue.getInstance().stopProcessing();
    console.log("  Job queue stopped");
  } catch (error) {
    console.error("  Error stopping job queue:", error);
  }

  try {
    ScheduledJobs.getInstance().stop();
    console.log("  Scheduled jobs stopped");
  } catch (error) {
    console.error("  Error stopping scheduled jobs:", error);
  }

  process.exit(0);
}

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

async function startServer() {
  await initializeApp();

  console.log(`🚀 Server is running on port ${port}`);

  serve({
    fetch: app.fetch,
    port,
  });
}

startServer();

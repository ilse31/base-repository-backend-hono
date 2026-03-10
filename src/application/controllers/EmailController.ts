import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { ResponseMiddleware } from "../middleware/ResponseMiddleware";
import { JobQueue } from "@/infrastructure/queue/JobQueue";
import { ApiError } from "../errors/ApiError";

const SendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().optional(),
  html: z.string().optional(),
});

const SendWelcomeEmailSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

const SendPasswordResetEmailSchema = z.object({
  email: z.string().email(),
  resetToken: z.string().min(1),
});

export class EmailController {
  public router = new Hono();

  constructor() {
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post(
      "/send",
      zValidator("json", SendEmailSchema),
      this.sendEmail.bind(this),
    );

    this.router.post(
      "/welcome",
      zValidator("json", SendWelcomeEmailSchema),
      this.sendWelcomeEmail.bind(this),
    );

    this.router.post(
      "/password-reset",
      zValidator("json", SendPasswordResetEmailSchema),
      this.sendPasswordResetEmail.bind(this),
    );

    this.router.get("/queue/status", this.getQueueStatus.bind(this));
    this.router.get("/queue/stats", this.getQueueStats.bind(this));
  }

  private async sendEmail(c: any) {
    try {
      const input = c.req.valid("json");
      const jobQueue = JobQueue.getInstance();

      const jobId = await jobQueue.addJob("custom_email", input);

      return ResponseMiddleware.sendSuccess(
        c,
        { jobId, message: "Email queued for delivery" },
        "Email queued successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }
      return ResponseMiddleware.sendError(c, (error as Error).message);
    }
  }

  private async sendWelcomeEmail(c: any) {
    try {
      const input = c.req.valid("json");
      const jobQueue = JobQueue.getInstance();

      const jobId = await jobQueue.addJob("welcome_email", input);

      return ResponseMiddleware.sendSuccess(
        c,
        { jobId, message: "Welcome email queued for delivery" },
        "Welcome email queued successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }
      return ResponseMiddleware.sendError(c, (error as Error).message);
    }
  }

  private async sendPasswordResetEmail(c: any) {
    try {
      const input = c.req.valid("json");
      const jobQueue = JobQueue.getInstance();

      const jobId = await jobQueue.addJob("password_reset_email", input);

      return ResponseMiddleware.sendSuccess(
        c,
        { jobId, message: "Password reset email queued for delivery" },
        "Password reset email queued successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }
      return ResponseMiddleware.sendError(c, (error as Error).message);
    }
  }

  private async getQueueStatus(c: any) {
    try {
      const jobQueue = JobQueue.getInstance();
      const stats = await jobQueue.getQueueStats();

      return ResponseMiddleware.sendSuccess(
        c,
        stats,
        "Queue status retrieved successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }
      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }

  private async getQueueStats(c: any) {
    try {
      const jobQueue = JobQueue.getInstance();

      const sampleJobs = [
        "custom_email",
        "welcome_email",
        "password_reset_email",
        "post_published_email",
      ];

      const jobStatuses = await Promise.all(
        sampleJobs.map(async (jobType) => {
          const status = await jobQueue.getJobStatus(jobType);
          return { jobType, status };
        }),
      );

      return ResponseMiddleware.sendSuccess(
        c,
        { jobStatuses },
        "Queue statistics retrieved successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }
      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }
}

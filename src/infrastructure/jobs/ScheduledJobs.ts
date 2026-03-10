import { CronService } from "../cron/CronService";
import { JobQueue } from "../queue/JobQueue";
import { DatabaseService } from "../database/DatabaseService";
import { RedisClient } from "../redis";
import { EmailService } from "../email/EmailService";

export class ScheduledJobs {
  private static instance: ScheduledJobs;
  private cronService: CronService;
  private jobQueue: JobQueue;

  private constructor() {
    this.cronService = CronService.getInstance();
    this.jobQueue = JobQueue.getInstance();
  }

  public static getInstance(): ScheduledJobs {
    if (!ScheduledJobs.instance) {
      ScheduledJobs.instance = new ScheduledJobs();
    }
    return ScheduledJobs.instance;
  }

  /**
   * Register all scheduled jobs
   */
  registerAllJobs(): void {
    this.registerHealthCheckJob();
    this.registerDatabaseCleanupJob();
    this.registerEmailQueueProcessor();
    this.registerCacheCleanupJob();
    this.registerDailyReportJob();
    this.registerWeeklyMaintenanceJob();

    console.log("All scheduled jobs registered");
  }

  /**
   * Health check job - runs every 5 minutes
   */
  private registerHealthCheckJob(): void {
    this.cronService.addJob("health-check", "*/5 * * * *", async () => {
      try {
        const dbHealth =
          await DatabaseService.getInstance().checkDatabaseHealth();

        const redisHealth = await RedisClient.getInstance().healthCheck();

        const emailService = EmailService.getInstance();
        const emailReady = emailService.isReady();

        const queueStats = await this.jobQueue.getQueueStats();

        console.log(" Health Check Results:", {
          database: dbHealth.connected ? " " : " ",
          redis: redisHealth.connected ? " " : " ",
          email: emailReady ? " " : " ",
          queue: {
            pending: queueStats.pending,
            processing: queueStats.processing,
            failed: queueStats.failed,
          },
        });

        if (!dbHealth.connected || !redisHealth.connected) {
          console.error(" Health Check Alert: Critical services down!");

          if (emailReady && process.env.ADMIN_EMAIL) {
            await this.jobQueue.addJob("custom_email", {
              to: process.env.ADMIN_EMAIL,
              subject: " Service Health Alert",
              html: `
                <h2>Service Health Alert</h2>
                <p>The following services are experiencing issues:</p>
                <ul>
                  <li>Database: ${dbHealth.connected ? "  OK" : "  DOWN"}</li>
                  <li>Redis: ${redisHealth.connected ? "  OK" : "  DOWN"}</li>
                  <li>Email: ${emailReady ? "  OK" : "  DOWN"}</li>
                </ul>
                <p>Time: ${new Date().toISOString()}</p>
              `,
            });
          }
        }
      } catch (error) {
        console.error("  Health check job failed:", error);
      }
    });
  }

  /**
   * Database cleanup job - runs daily at 2 AM
   */
  private registerDatabaseCleanupJob(): void {
    this.cronService.addJob("database-cleanup", "0 2 * * *", async () => {
      try {
        console.log(" Starting database cleanup...");

        await this.jobQueue.clearCompletedJobs(24);
        await this.jobQueue.clearFailedJobs(72);

        console.log("Database cleanup completed");
      } catch (error) {
        console.error("Database cleanup job failed:", error);
      }
    });
  }

  /**
   * Email queue processor - runs every minute to process email jobs
   */
  private registerEmailQueueProcessor(): void {
    this.cronService.addJob("email-queue-processor", "* * * * *", async () => {
      try {
        const stats = await this.jobQueue.getQueueStats();

        if (stats.pending > 100) {
          console.warn(
            `  High email queue backlog: ${stats.pending} pending emails`,
          );
        }

        if (stats.failed > 10) {
          console.error(
            `  High email failure rate: ${stats.failed} failed emails`,
          );
        }
      } catch (error) {
        console.error("  Email queue processor job failed:", error);
      }
    });
  }

  /**
   * Cache cleanup job - runs every 6 hours
   */
  private registerCacheCleanupJob(): void {
    this.cronService.addJob("cache-cleanup", "0 */6 * * *", async () => {
      try {
        console.log("Starting cache cleanup...");

        const redis = RedisClient.getInstance().getClient();

        const info = await redis.info("memory");
        const keyspace = await redis.info("keyspace");

        console.log("Cache Statistics:", {
          memory: info
            .split("\r\n")
            .find((line) => line.startsWith("used_memory_human:"))
            ?.split(":")[1],
          keys: keyspace
            .split("\r\n")
            .find((line) => line.startsWith("db"))
            ?.split(":")[1]
            ?.split(",")[0],
        });

        console.log("Cache cleanup completed");
      } catch (error) {
        console.error("Cache cleanup job failed:", error);
      }
    });
  }

  /**
   * Daily report job - runs daily at 9 AM
   */
  private registerDailyReportJob(): void {
    this.cronService.addJob("daily-report", "0 9 * * *", async () => {
      try {
        console.log("Generating daily report...");

        const dbHealth =
          await DatabaseService.getInstance().checkDatabaseHealth();
        const queueStats = await this.jobQueue.getQueueStats();
        const cronHealth = this.cronService.healthCheck();

        const report = {
          date: new Date().toISOString().split("T")[0],
          database: {
            connected: dbHealth.connected,
            userCount: dbHealth.userCount,
            postCount: dbHealth.postCount,
          },
          queue: queueStats,
          cron: cronHealth,
        };

        console.log(" Daily Report:", report);

        if (process.env.ADMIN_EMAIL && EmailService.getInstance().isReady()) {
          await this.jobQueue.addJob("custom_email", {
            to: process.env.ADMIN_EMAIL,
            subject: ` Daily Report - ${report.date}`,
            html: `
              <h2>Daily System Report - ${report.date}</h2>
              
              <h3>Database</h3>
              <ul>
                <li>Status: ${report.database.connected ? "  Connected" : "  Disconnected"}</li>
                <li>Users: ${report.database.userCount}</li>
                <li>Posts: ${report.database.postCount}</li>
              </ul>
              
              <h3>Job Queue</h3>
              <ul>
                <li>Pending: ${report.queue.pending}</li>
                <li>Processing: ${report.queue.processing}</li>
                <li>Completed: ${report.queue.completed}</li>
                <li>Failed: ${report.queue.failed}</li>
              </ul>
              
              <h3>Cron Jobs</h3>
              <ul>
                <li>Total Jobs: ${report.cron.totalJobs}</li>
                <li>Enabled: ${report.cron.enabledJobs}</li>
                <li>Running: ${report.cron.runningJobs}</li>
                <li>Failed: ${report.cron.failedJobs}</li>
              </ul>
            `,
          });
        }

        console.log("Daily report generated");
      } catch (error) {
        console.error("Daily report job failed:", error);
      }
    });
  }

  /**
   * Weekly maintenance job - runs every Sunday at 3 AM
   */
  private registerWeeklyMaintenanceJob(): void {
    this.cronService.addJob("weekly-maintenance", "0 3 * * 0", async () => {
      try {
        console.log("Starting weekly maintenance...");

        await this.jobQueue.clearCompletedJobs(48);
        await this.jobQueue.clearFailedJobs(168);

        // You could add more weekly maintenance tasks here:
        // - Database optimization
        // - Log rotation
        // - Security scans
        // - Backup verification
        // - Performance analysis

        console.log("Weekly maintenance completed");
      } catch (error) {
        console.error("Weekly maintenance job failed:", error);
      }
    });
  }

  /**
   * Start all scheduled jobs
   */
  async start(): Promise<void> {
    await this.cronService.start();
    console.log("Scheduled jobs started");
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    this.cronService.stop();
    console.log("Scheduled jobs stopped");
  }

  /**
   * Get status of all scheduled jobs
   */
  getStatus(): any {
    return {
      cron: this.cronService.healthCheck(),
      jobs: this.cronService.getAllJobs().map((job) => ({
        name: job.name,
        schedule: job.schedule,
        enabled: job.enabled,
        isRunning: job.isRunning,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
      })),
    };
  }
}

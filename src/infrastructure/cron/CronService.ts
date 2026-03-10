export interface CronJob {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
}

export class CronService {
  private static instance: CronService;
  private jobs: Map<string, CronJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  private constructor() {}

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  /**
   * Add a cron job
   */
  addJob(name: string, schedule: string, handler: () => Promise<void>): void {
    const job: CronJob = {
      name,
      schedule,
      handler,
      enabled: true,
      isRunning: false,
    };

    this.jobs.set(name, job);
    console.log(`Cron job added: ${name} (${schedule})`);
  }

  /**
   * Remove a cron job
   */
  removeJob(name: string): void {
    this.stopJob(name);
    this.jobs.delete(name);
    console.log(`Cron job removed: ${name}`);
  }

  /**
   * Enable/disable a cron job
   */
  toggleJob(name: string, enabled: boolean): void {
    const job = this.jobs.get(name);
    if (job) {
      job.enabled = enabled;
      if (enabled && !this.isRunning) {
        this.scheduleJob(job);
      } else if (!enabled) {
        this.stopJob(name);
      }
      console.log(
        `${enabled ? "" : ""} Cron job ${enabled ? "enabled" : "disabled"}: ${name}`,
      );
    }
  }

  /**
   * Start all enabled cron jobs
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Cron service is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting cron service...");

    for (const job of this.jobs.values()) {
      if (job.enabled) {
        this.scheduleJob(job);
      }
    }

    console.log(`Cron service started with ${this.jobs.size} jobs`);
  }

  /**
   * Stop all cron jobs
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log("Stopping cron service...");

    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();
    this.isRunning = false;

    console.log("Cron service stopped");
  }

  /**
   * Get job status
   */
  getJobStatus(name: string): CronJob | undefined {
    return this.jobs.get(name);
  }

  /**
   * Get all jobs status
   */
  getAllJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Manually run a job
   */
  async runJob(name: string): Promise<void> {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job not found: ${name}`);
    }

    if (job.isRunning) {
      console.log(`Job ${name} is already running`);
      return;
    }

    console.log(`Manually running job: ${name}`);
    await this.executeJob(job);
  }

  private scheduleJob(job: CronJob): void {
    const nextRun = this.getNextRunTime(job.schedule);
    job.nextRun = nextRun;

    const delay = nextRun.getTime() - Date.now();
    if (delay <= 0) {
      this.executeJob(job).then(() => {
        if (job.enabled && this.isRunning) {
          this.scheduleJob(job);
        }
      });
    } else {
      const timer = setTimeout(() => {
        this.executeJob(job).then(() => {
          if (job.enabled && this.isRunning) {
            this.scheduleJob(job);
          }
        });
      }, delay);

      this.timers.set(job.name, timer);
    }
  }

  private stopJob(name: string): void {
    const timer = this.timers.get(name);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(name);
    }
  }

  private async executeJob(job: CronJob): Promise<void> {
    if (job.isRunning) {
      return;
    }

    job.isRunning = true;
    job.lastRun = new Date();

    try {
      console.log(`Executing cron job: ${job.name}`);
      await job.handler();
      console.log(`Cron job completed: ${job.name}`);
    } catch (error) {
      console.error(`Cron job failed: ${job.name}`, error);
    } finally {
      job.isRunning = false;
    }
  }

  private getNextRunTime(cronExpression: string): Date {
    const parts = cronExpression.split(" ");
    if (parts.length !== 5) {
      throw new Error("Invalid cron expression format");
    }

    const [minute, hour, day, month, dayOfWeek] = parts;
    const now = new Date();
    const nextRun = new Date(now);

    if (minute !== undefined && minute !== "*") {
      const minuteNum = parseInt(minute, 10);
      if (!isNaN(minuteNum)) {
        nextRun.setMinutes(minuteNum);
        if (nextRun <= now) {
          nextRun.setHours(nextRun.getHours() + 1);
        }
      }
    } else if (minute === "*") {
      nextRun.setMinutes(now.getMinutes() + 1);
    }

    if (hour !== undefined && hour !== "*") {
      const hourNum = parseInt(hour, 10);
      if (!isNaN(hourNum)) {
        nextRun.setHours(hourNum);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
    }

    return nextRun;
  }

  /**
   * Parse common cron expressions
   */
  static getCommonSchedules(): Record<string, string> {
    return {
      EVERY_MINUTE: "* * * * *",
      EVERY_5_MINUTES: "*/5 * * * *",
      EVERY_15_MINUTES: "*/15 * * * *",
      EVERY_30_MINUTES: "*/30 * * * *",
      EVERY_HOUR: "0 * * * *",
      EVERY_2_HOURS: "0 */2 * * *",
      EVERY_6_HOURS: "0 */6 * * *",
      EVERY_12_HOURS: "0 */12 * * *",
      DAILY_AT_MIDNIGHT: "0 0 * * *",
      DAILY_AT_NOON: "0 12 * * *",
      WEEKLY_ON_MONDAY: "0 0 * * 1",
      WEEKLY_ON_SUNDAY: "0 0 * * 0",
      MONTHLY_ON_FIRST: "0 0 1 * *",
      YEARLY_ON_JAN_FIRST: "0 0 1 1 *",
    };
  }

  /**
   * Health check for cron service
   */
  healthCheck(): {
    isRunning: boolean;
    totalJobs: number;
    enabledJobs: number;
    runningJobs: number;
    failedJobs: number;
  } {
    const jobs = Array.from(this.jobs.values());
    const enabledJobs = jobs.filter((job) => job.enabled).length;
    const runningJobs = jobs.filter((job) => job.isRunning).length;
    const failedJobs = jobs.filter(
      (job) =>
        job.lastRun &&
        job.lastRun < new Date(Date.now() - 5 * 60 * 1000) &&
        !job.isRunning,
    ).length;

    return {
      isRunning: this.isRunning,
      totalJobs: jobs.length,
      enabledJobs,
      runningJobs,
      failedJobs,
    };
  }
}

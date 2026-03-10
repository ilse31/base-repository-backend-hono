import { RedisClient } from "../redis";

export interface Job {
  id: string;
  type: string;
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  delay: number;
  createdAt: Date;
  scheduledAt?: Date | undefined;
  processedAt?: Date | undefined;
  completedAt?: Date | undefined;
  failedAt?: Date | undefined;
  error?: string | undefined;
}

export interface JobResult {
  success: boolean;
  error?: string | undefined;
  data?: any;
}

export abstract class BaseJob {
  abstract type: string;
  abstract priority: number;
  abstract maxAttempts: number;
  abstract delay: number;

  abstract execute(data: any): Promise<JobResult>;
}

export class JobQueue {
  private static instance: JobQueue;
  private redis: ReturnType<RedisClient["getClient"]>;
  private isProcessing: boolean = false;
  private jobHandlers: Map<string, BaseJob> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.redis = RedisClient.getInstance().getClient();
  }

  public static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  registerJob(job: BaseJob): void {
    this.jobHandlers.set(job.type, job);
  }

  async addJob(
    type: string,
    data: any,
    options: {
      priority?: number;
      delay?: number;
      scheduledAt?: Date;
    } = {},
  ): Promise<string> {
    const job: Job = {
      id: this.generateJobId(),
      type,
      data,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: 3,
      delay: options.delay || 0,
      createdAt: new Date(),
      scheduledAt: options.scheduledAt,
    };

    const queueKey = this.getQueueKey(job.priority);
    await this.redis.zadd(queueKey, this.getScore(job), JSON.stringify(job));

    console.log(`📋 Job added: ${job.type} (${job.id})`);
    return job.id;
  }

  async getJobStatus(jobId: string): Promise<Job | null> {
    const jobKey = `job:${jobId}`;
    const jobData = await this.redis.get(jobKey);
    return jobData ? JSON.parse(jobData) : null;
  }

  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const pipeline = this.redis.pipeline();

    pipeline.zcard("queue:high");
    pipeline.zcard("queue:medium");
    pipeline.zcard("queue:low");
    pipeline.zcard("queue:processing");
    pipeline.zcard("queue:completed");
    pipeline.zcard("queue:failed");

    const results = await pipeline.exec();
    const [
      high = 0,
      medium = 0,
      low = 0,
      processing = 0,
      completed = 0,
      failed = 0,
    ] = results?.map((r) => r[1] as number) || [];

    return {
      pending: high + medium + low,
      processing,
      completed,
      failed,
    };
  }

  async startProcessing(intervalMs: number = 5000): Promise<void> {
    if (this.isProcessing) {
      console.log("Job queue is already processing");
      return;
    }

    this.isProcessing = true;
    console.log(`Starting job queue processing (interval: ${intervalMs}ms)`);

    this.processingInterval = setInterval(async () => {
      await this.processJobs();
    }, intervalMs);

    await this.processJobs();
  }

  async stopProcessing(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    console.log("Job queue processing stopped");
  }

  private async processJobs(): Promise<void> {
    try {
      const queues = ["queue:high", "queue:medium", "queue:low"];

      for (const queueKey of queues) {
        const jobData = await this.redis.zpopmin(queueKey, 1);

        if (jobData && jobData.length > 0 && jobData[0]) {
          const job: Job = JSON.parse(jobData[0]);
          await this.processJob(job);
          break;
        }
      }
    } catch (error) {
      console.error("Error processing jobs:", error);
    }
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.jobHandlers.get(job.type);
    if (!handler) {
      console.error(`No handler found for job type: ${job.type}`);
      await this.markJobFailed(job, "No handler found");
      return;
    }

    await this.redis.zadd("queue:processing", Date.now(), JSON.stringify(job));
    job.processedAt = new Date();

    try {
      console.log(`Processing job: ${job.type} (${job.id})`);

      const result = await handler.execute(job.data);

      if (result.success) {
        await this.markJobCompleted(job, result.data);
        console.log(`Job completed successfully: ${job.type} (${job.id})`);
      } else {
        await this.handleJobFailure(job, result.error);
      }
    } catch (error) {
      await this.handleJobFailure(
        job,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private async handleJobFailure(
    job: Job,
    error?: string | undefined,
  ): Promise<void> {
    job.attempts++;
    job.error = error;

    if (job.attempts >= job.maxAttempts) {
      await this.markJobFailed(job, error);
      console.error(
        `Job failed permanently: ${job.type} (${job.id}) - ${error || "Unknown error"}`,
      );
    } else {
      const retryDelay = Math.pow(2, job.attempts) * 1000;
      job.scheduledAt = new Date(Date.now() + retryDelay);

      await this.redis.zadd(
        "queue:medium",
        this.getScore(job),
        JSON.stringify(job),
      );
      console.warn(
        `Job retry scheduled: ${job.type} (${job.id}) - attempt ${job.attempts}/${job.maxAttempts}`,
      );
    }
  }

  private async markJobCompleted(job: Job, resultData?: any): Promise<void> {
    job.completedAt = new Date();
    job.data = { ...job.data, result: resultData };

    await this.redis.zadd("queue:completed", Date.now(), JSON.stringify(job));
    await this.redis.setex(`job:${job.id}`, 86400, JSON.stringify(job));
  }

  private async markJobFailed(
    job: Job,
    error?: string | undefined,
  ): Promise<void> {
    job.failedAt = new Date();
    job.error = error;

    await this.redis.zadd("queue:failed", Date.now(), JSON.stringify(job));
    await this.redis.setex(`job:${job.id}`, 86400, JSON.stringify(job));
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getQueueKey(priority: number): string {
    if (priority >= 8) return "queue:high";
    if (priority >= 4) return "queue:medium";
    return "queue:low";
  }

  private getScore(job: Job): number {
    return job.scheduledAt ? job.scheduledAt.getTime() : Date.now();
  }

  async clearCompletedJobs(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
    const removed = await this.redis.zremrangebyscore(
      "queue:completed",
      0,
      cutoffTime,
    );
    console.log(
      `Cleared ${removed} completed jobs older than ${olderThanHours} hours`,
    );
    return removed;
  }

  async clearFailedJobs(olderThanHours: number = 72): Promise<number> {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
    const removed = await this.redis.zremrangebyscore(
      "queue:failed",
      0,
      cutoffTime,
    );
    console.log(
      `Cleared ${removed} failed jobs older than ${olderThanHours} hours`,
    );
    return removed;
  }
}

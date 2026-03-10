import Redis from "ioredis";

export class RedisClient {
  private static instance: RedisClient;
  private client: Redis;

  private constructor() {
    this.client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    } as any);

    this.client.on("connect", () => {
      console.log("Redis connected successfully (no password)");
    });

    this.client.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    this.client.on("close", () => {
      console.log("Redis connection closed");
    });

    this.client.on("reconnecting", () => {
      console.log("Redis reconnecting...");
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): Redis {
    return this.client;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      console.error("  Failed to connect to Redis:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (error) {
      console.error("  Error disconnecting Redis:", error);
    }
  }

  public async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch (error) {
      console.error("  Redis ping failed:", error);
      return false;
    }
  }

  public async healthCheck(): Promise<{
    connected: boolean;
    latency?: number;
  }> {
    try {
      const start = Date.now();
      const result = await this.client.ping();
      const latency = Date.now() - start;

      return {
        connected: result === "PONG",
        latency,
      };
    } catch (error) {
      console.error("  Redis health check failed:", error);
      return { connected: false };
    }
  }
}

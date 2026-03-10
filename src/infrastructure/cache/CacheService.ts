import Redis from "ioredis";

export class CacheService {
  private redis: Redis;
  private isConnected = false;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    this.redis.on("connect", () => {
      this.isConnected = true;
      console.log("Redis connected");
    });

    this.redis.on("error", (err) => {
      this.isConnected = false;
      console.error("Redis connection error:", err);
    });

    this.redis.on("close", () => {
      this.isConnected = false;
      console.log("Redis connection closed");
    });
  }

  private isHealthy(): boolean {
    return this.isConnected && this.redis.status === "ready";
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isHealthy()) {
      return null;
    }

    try {
      const cached = await this.redis.get(key);
      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    if (!this.isHealthy()) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isHealthy()) {
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async delMultiple(keys: string[]): Promise<void> {
    if (!this.isHealthy() || keys.length === 0) {
      return;
    }

    try {
      const pipeline = this.redis.pipeline();
      keys.forEach((key) => pipeline.del(key));
      await pipeline.exec();
    } catch (error) {
      console.error(`Cache multiple delete error:`, error);
    }
  }

  async atomicSetDelete(
    setKey: string,
    setValue: any,
    deleteKeys: string[],
    ttlSeconds = 3600,
  ): Promise<void> {
    if (!this.isHealthy()) {
      return;
    }

    try {
      const pipeline = this.redis.pipeline();

      deleteKeys.forEach((key) => pipeline.del(key));

      const serialized = JSON.stringify(setValue);
      if (ttlSeconds > 0) {
        pipeline.setex(setKey, ttlSeconds, serialized);
      } else {
        pipeline.set(setKey, serialized);
      }

      await pipeline.exec();
    } catch (error) {
      console.error(`Atomic cache operation error:`, error);
    }
  }

  generateKey(entity: string, identifier: string): string {
    return `clean_arch:${entity}:${identifier}`;
  }

  generateListKey(entity: string): string {
    return `clean_arch:${entity}:list`;
  }

  generateRelationKey(
    parentEntity: string,
    parentId: string,
    childEntity: string,
  ): string {
    return `clean_arch:${parentEntity}:${parentId}:${childEntity}`;
  }
}

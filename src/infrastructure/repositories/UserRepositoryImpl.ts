import { User, CreateUserInput, UpdateUserInput } from "@/domain/entities/User";
import { IUserRepository } from "@/domain/repositories/UserRepository";
import { PrismaService } from "@/infrastructure/database/prisma";
import { RedisClient } from "@/infrastructure/redis";
import { CacheService } from "@/infrastructure/cache/CacheService";

/**
 * Implementation of IUserRepository with caching support
 */
export class UserRepositoryImpl implements IUserRepository {
  private prisma = PrismaService.getInstance().getPrisma();
  private cacheService: CacheService;

  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  constructor() {
    this.cacheService = new CacheService(RedisClient.getInstance().getClient());
  }

  /**
   * Creates a new user in the database and updates cache atomically
   * @param input - User creation input data
   * @returns Created user object
   */
  async create(input: CreateUserInput): Promise<User> {
    const data: {
      email: string;
      passwordHash: string;
      name?: string | null;
    } = {
      email: input.email,
      passwordHash: "legacy-user-no-login",
    };

    if (input.name !== undefined) {
      data.name = input.name;
    }

    const user = await this.prisma.user.create({
      data,
      select: this.userSelect,
    });

    const userKey = this.cacheService.generateKey("user", user.id);
    const listKey = this.cacheService.generateListKey("users");

    await this.cacheService.atomicSetDelete(userKey, user, [listKey], 3600);

    return user;
  }

  /**
   * Finds a user by ID, with caching support
   * @param id - User ID to search for
   * @returns User object if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    const cacheKey = this.cacheService.generateKey("user", id);
    const cached = await this.cacheService.get<User>(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (user) {
      await this.cacheService.set(cacheKey, user, 3600);
    }

    return user;
  }

  /**
   * Finds a user by email address
   * @param email - User email to search for
   * @returns User object if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: this.userSelect,
    });

    return user;
  }

  /**
   * Updates a user in the database and invalidates cache atomically
   * @param id - User ID to update
   * @param input - User update input data
   * @returns Updated user object
   */
  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: input,
      select: this.userSelect,
    });

    const userKey = this.cacheService.generateKey("user", id);
    const listKey = this.cacheService.generateListKey("users");

    await this.cacheService.atomicSetDelete(userKey, user, [listKey], 3600);

    return user;
  }

  /**
   * Deletes a user from the database and invalidates cache
   * @param id - User ID to delete
   */
  async delete(id: string): Promise<void> {
    const userKey = this.cacheService.generateKey("user", id);
    const listKey = this.cacheService.generateListKey("users");

    await this.prisma.user.delete({
      where: { id },
    });

    await this.cacheService.delMultiple([userKey, listKey]);
  }

  /**
   * Retrieves all users with caching support
   * @returns Array of user objects ordered by creation date descending
   */
  async findAll(): Promise<User[]> {
    const listKey = this.cacheService.generateListKey("users");
    const cached = await this.cacheService.get<User[]>(listKey);

    if (cached) {
      return cached;
    }

    const users = await this.prisma.user.findMany({
      select: this.userSelect,
      orderBy: { createdAt: "desc" },
    });

    await this.cacheService.set(listKey, users, 3600);

    return users;
  }
}

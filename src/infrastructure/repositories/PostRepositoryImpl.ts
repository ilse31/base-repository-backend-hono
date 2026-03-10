import { Post, CreatePostInput, UpdatePostInput } from "@/domain/entities/Post";
import { IPostRepository } from "@/domain/repositories/PostRepository";
import { PrismaService } from "@/infrastructure/database/prisma";
import { RedisClient } from "@/infrastructure/redis";
import { CacheService } from "@/infrastructure/cache/CacheService";

export class PostRepositoryImpl implements IPostRepository {
  private prisma = PrismaService.getInstance().getPrisma();
  private cacheService: CacheService;

  constructor() {
    this.cacheService = new CacheService(RedisClient.getInstance().getClient());
  }

  async create(input: CreatePostInput): Promise<Post> {
    const post = await this.prisma.post.create({
      data: input,
      include: {
        author: true,
      },
    });

    const postKey = this.cacheService.generateKey("post", post.id);
    const listKey = this.cacheService.generateListKey("posts");
    const authorKey = this.cacheService.generateRelationKey(
      "author",
      input.authorId,
      "posts",
    );

    await this.cacheService.atomicSetDelete(
      postKey,
      post,
      [listKey, authorKey],
      3600,
    );

    return post;
  }

  async findById(id: string): Promise<Post | null> {
    const cacheKey = this.cacheService.generateKey("post", id);
    const cached = await this.cacheService.get<Post>(cacheKey);

    if (cached) {
      return cached;
    }

    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });

    if (post) {
      await this.cacheService.set(cacheKey, post, 3600);
    }

    return post;
  }

  async findByAuthorId(authorId: string): Promise<Post[]> {
    const authorKey = this.cacheService.generateRelationKey(
      "author",
      authorId,
      "posts",
    );
    const cached = await this.cacheService.get<Post[]>(authorKey);

    if (cached) {
      return cached;
    }

    const posts = await this.prisma.post.findMany({
      where: { authorId },
      include: {
        author: true,
      },
      orderBy: { createdAt: "desc" },
    });

    await this.cacheService.set(authorKey, posts, 3600);

    return posts;
  }

  async update(id: string, input: UpdatePostInput): Promise<Post> {
    const post = await this.prisma.post.update({
      where: { id },
      data: input,
      include: {
        author: true,
      },
    });

    const postKey = this.cacheService.generateKey("post", id);
    const listKey = this.cacheService.generateListKey("posts");
    const authorKey = this.cacheService.generateRelationKey(
      "author",
      post.authorId,
      "posts",
    );

    await this.cacheService.atomicSetDelete(
      postKey,
      post,
      [listKey, authorKey],
      3600,
    );

    return post;
  }

  async delete(id: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return;
    }

    await this.prisma.post.delete({
      where: { id },
    });

    const postKey = this.cacheService.generateKey("post", id);
    const listKey = this.cacheService.generateListKey("posts");
    const authorKey = this.cacheService.generateRelationKey(
      "author",
      post.authorId,
      "posts",
    );

    await this.cacheService.delMultiple([postKey, listKey, authorKey]);
  }

  async findAll(): Promise<Post[]> {
    const listKey = this.cacheService.generateListKey("posts");
    const cached = await this.cacheService.get<Post[]>(listKey);

    if (cached) {
      return cached;
    }

    const posts = await this.prisma.post.findMany({
      include: {
        author: true,
      },
      orderBy: { createdAt: "desc" },
    });

    await this.cacheService.set(listKey, posts, 3600);

    return posts;
  }
}

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PostService } from "@/domain/services/PostService";
import { CreatePostInput, UpdatePostInput } from "@/domain/entities/Post";
import { ResponseMiddleware } from "../middleware/ResponseMiddleware";
import { ApiError } from "../errors/ApiError";
import {
  PostCreateSchema,
  PostUpdateSchema,
  IdParamSchema,
  AuthorIdParamSchema,
} from "@/domain/validation/Schemas";

export class PostController {
  public router = new Hono();
  constructor(private postService: PostService) {
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post(
      "/",
      zValidator("json", PostCreateSchema),
      this.createPost.bind(this),
    );
    this.router.get("/", this.getAllPosts.bind(this));
    this.router.get(
      "/:id",
      zValidator("param", IdParamSchema),
      this.getPostById.bind(this),
    );
    this.router.get(
      "/author/:authorId",
      zValidator("param", AuthorIdParamSchema),
      this.getPostsByAuthor.bind(this),
    );
    this.router.put(
      "/:id",
      zValidator("param", IdParamSchema),
      zValidator("json", PostUpdateSchema),
      this.updatePost.bind(this),
    );
    this.router.delete(
      "/:id",
      zValidator("param", IdParamSchema),
      this.deletePost.bind(this),
    );
  }

  private async createPost(c: any) {
    try {
      const input = c.req.valid("json") as CreatePostInput;
      const post = await this.postService.createPost(input);
      return ResponseMiddleware.sendCreated(
        c,
        post,
        "Post created successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }
      return ResponseMiddleware.sendError(c, (error as Error).message);
    }
  }

  private async getAllPosts(c: any) {
    try {
      const posts = await this.postService.getAllPosts();
      return ResponseMiddleware.sendSuccess(
        c,
        posts,
        "Posts retrieved successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }
      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }

  private async getPostById(c: any) {
    try {
      const { id } = c.req.valid("param");
      const post = await this.postService.getPostById(id);

      return ResponseMiddleware.sendSuccess(
        c,
        post,
        "Post retrieved successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }
      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }

  private async getPostsByAuthor(c: any) {
    try {
      const { authorId } = c.req.valid("param");
      const posts = await this.postService.getPostsByAuthor(authorId);
      return ResponseMiddleware.sendSuccess(
        c,
        posts,
        "Posts retrieved successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }
      return ResponseMiddleware.sendError(c, (error as Error).message);
    }
  }

  private async updatePost(c: any) {
    try {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json") as UpdatePostInput;
      const post = await this.postService.updatePost(id, input);
      return ResponseMiddleware.sendUpdated(
        c,
        post,
        "Post updated successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }
      return ResponseMiddleware.sendError(c, (error as Error).message);
    }
  }

  private async deletePost(c: any) {
    try {
      const { id } = c.req.valid("param");
      await this.postService.deletePost(id);
      return ResponseMiddleware.sendDeleted(c, "Post deleted successfully");
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }
      return ResponseMiddleware.sendError(c, (error as Error).message);
    }
  }
}

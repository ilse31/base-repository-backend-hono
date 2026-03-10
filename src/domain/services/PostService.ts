import { Post, CreatePostInput, UpdatePostInput } from "@/domain/entities/Post";
import { IPostRepository } from "@/domain/repositories/PostRepository";
import { IUserRepository } from "@/domain/repositories/UserRepository";
import {
  PostNotFoundError,
  DatabaseError,
} from "@/application/errors/ApiError";
import { ValidationService } from "@/domain/validation/ValidationService";

export class PostService {
  constructor(
    private postRepository: IPostRepository,
    private userRepository: IUserRepository,
  ) {}

  async createPost(input: CreatePostInput): Promise<Post> {
    const validatedInput = ValidationService.validatePostCreate(input);

    const author = await this.userRepository.findById(validatedInput.authorId);
    if (!author) {
      throw new PostNotFoundError(undefined, "createPost - author not found");
    }

    try {
      return this.postRepository.create(validatedInput);
    } catch (error) {
      throw new DatabaseError(
        "createPost",
        { input: validatedInput },
        "createPost",
      );
    }
  }

  async getPostById(id: string): Promise<Post> {
    const validatedId = ValidationService.validateId(id);

    const post = await this.postRepository.findById(validatedId);
    if (!post) {
      throw new PostNotFoundError(validatedId, "getPostById");
    }
    return post;
  }

  async getPostsByAuthor(authorId: string): Promise<Post[]> {
    const validatedAuthorId = ValidationService.validateId(authorId);

    const author = await this.userRepository.findById(validatedAuthorId);
    if (!author) {
      throw new PostNotFoundError(
        undefined,
        "getPostsByAuthor - author not found",
      );
    }

    try {
      return this.postRepository.findByAuthorId(validatedAuthorId);
    } catch (error) {
      throw new DatabaseError(
        "findByAuthorId",
        { authorId: validatedAuthorId },
        "getPostsByAuthor",
      );
    }
  }

  async updatePost(id: string, input: UpdatePostInput): Promise<Post> {
    const validatedId = ValidationService.validateId(id);
    const validatedInput = ValidationService.validatePostUpdate(input);

    const post = await this.postRepository.findById(validatedId);
    if (!post) {
      throw new PostNotFoundError(validatedId, "updatePost");
    }

    try {
      return this.postRepository.update(validatedId, validatedInput);
    } catch (error) {
      throw new DatabaseError(
        "updatePost",
        { id: validatedId, input: validatedInput },
        "updatePost",
      );
    }
  }

  async deletePost(id: string): Promise<void> {
    const validatedId = ValidationService.validateId(id);

    const post = await this.postRepository.findById(validatedId);
    if (!post) {
      throw new PostNotFoundError(validatedId, "deletePost");
    }

    try {
      this.postRepository.delete(validatedId);
    } catch (error) {
      throw new DatabaseError("deletePost", { id: validatedId }, "deletePost");
    }
  }

  async getAllPosts(): Promise<Post[]> {
    return this.postRepository.findAll();
  }
}

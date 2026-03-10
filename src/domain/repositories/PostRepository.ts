import { Post, CreatePostInput, UpdatePostInput } from '../entities/Post';

export interface IPostRepository {
  create(input: CreatePostInput): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findByAuthorId(authorId: string): Promise<Post[]>;
  update(id: string, input: UpdatePostInput): Promise<Post>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Post[]>;
}

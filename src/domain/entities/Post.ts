export interface Post {
  id: string;
  title: string;
  content: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}

export interface CreatePostInput {
  title: string;
  content?: string | null;
  published?: boolean;
  authorId: string;
}

export interface UpdatePostInput {
  title?: string;
  content?: string | null;
  published?: boolean;
}

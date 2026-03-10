export interface Post {
  id: string;
  title: string;
  content?: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}

export interface CreatePostInput {
  title: string;
  content?: string | undefined;
  published?: boolean | undefined;
  authorId: string;
}

export interface UpdatePostInput {
  title?: string | undefined;
  content?: string | undefined;
  published?: boolean | undefined;
}

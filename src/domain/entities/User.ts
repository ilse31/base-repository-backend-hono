export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name?: string | undefined;
}

export interface UpdateUserInput {
  name?: string | undefined;
}

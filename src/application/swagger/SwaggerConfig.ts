import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { z } from "zod";
import { UserSchema } from "../schemas/UserSchema";
import { PostSchema } from "../schemas/PostSchema";
import { CommonSchema } from "../schemas/CommonSchema";

export function createSwaggerApp() {
  const app = new Hono();

  // Swagger UI endpoint
  app.get("/doc", (c) => {
    return c.json({
      openapi: "3.0.0",
      info: {
        version: "1.0.0",
        title: "Clean Architecture Backend API",
        description:
          "A clean architecture backend built with Hono, PostgreSQL, Redis, and Prisma",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
      tags: [
        {
          name: "Users",
          description: "User management operations",
        },
        {
          name: "Posts",
          description: "Post management operations",
        },
      ],
      paths: {
        "/api/users": {
          get: {
            summary: "Get all users",
            description: "Retrieve a list of all users",
            tags: ["Users"],
            responses: {
              200: {
                description: "Users retrieved successfully",
                content: {
                  "application/json": {
                    schema: UserSchema.UserList,
                  },
                },
              },
            },
          },
          post: {
            summary: "Create a new user",
            description: "Create a new user with email and optional name",
            tags: ["Users"],
            requestBody: {
              content: {
                "application/json": {
                  schema: UserSchema.CreateUser,
                },
              },
            },
            responses: {
              201: {
                description: "User created successfully",
                content: {
                  "application/json": {
                    schema: UserSchema.UserResponse,
                  },
                },
              },
              400: {
                description: "Bad request",
                content: {
                  "application/json": {
                    schema: CommonSchema.ErrorResponse,
                  },
                },
              },
              409: {
                description: "User already exists",
                content: {
                  "application/json": {
                    schema: CommonSchema.ErrorResponse,
                  },
                },
              },
            },
          },
        },
        "/api/users/{id}": {
          get: {
            summary: "Get user by ID",
            description: "Retrieve a specific user by their ID",
            tags: ["Users"],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User ID",
              },
            ],
            responses: {
              200: {
                description: "User retrieved successfully",
                content: {
                  "application/json": {
                    schema: UserSchema.UserResponse,
                  },
                },
              },
              404: {
                description: "User not found",
                content: {
                  "application/json": {
                    schema: CommonSchema.ErrorResponse,
                  },
                },
              },
            },
          },
          put: {
            summary: "Update user",
            description: "Update an existing user's information",
            tags: ["Users"],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User ID",
              },
            ],
            requestBody: {
              content: {
                "application/json": {
                  schema: UserSchema.UpdateUser,
                },
              },
            },
            responses: {
              200: {
                description: "User updated successfully",
                content: {
                  "application/json": {
                    schema: UserSchema.UserResponse,
                  },
                },
              },
              404: {
                description: "User not found",
                content: {
                  "application/json": {
                    schema: CommonSchema.ErrorResponse,
                  },
                },
              },
            },
          },
          delete: {
            summary: "Delete user",
            description: "Delete a user by their ID",
            tags: ["Users"],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User ID",
              },
            ],
            responses: {
              200: {
                description: "User deleted successfully",
                content: {
                  "application/json": {
                    schema: CommonSchema.SuccessResponse,
                  },
                },
              },
              404: {
                description: "User not found",
                content: {
                  "application/json": {
                    schema: CommonSchema.ErrorResponse,
                  },
                },
              },
            },
          },
        },
        "/api/posts": {
          get: {
            summary: "Get all posts",
            description: "Retrieve a list of all posts",
            tags: ["Posts"],
            responses: {
              200: {
                description: "Posts retrieved successfully",
                content: {
                  "application/json": {
                    schema: PostSchema.PostList,
                  },
                },
              },
            },
          },
          post: {
            summary: "Create a new post",
            description: "Create a new post with title, content, and author",
            tags: ["Posts"],
            requestBody: {
              content: {
                "application/json": {
                  schema: PostSchema.CreatePost,
                },
              },
            },
            responses: {
              201: {
                description: "Post created successfully",
                content: {
                  "application/json": {
                    schema: PostSchema.PostResponse,
                  },
                },
              },
              400: {
                description: "Bad request",
                content: {
                  "application/json": {
                    schema: CommonSchema.ErrorResponse,
                  },
                },
              },
              404: {
                description: "Author not found",
                content: {
                  "application/json": {
                    schema: CommonSchema.ErrorResponse,
                  },
                },
              },
            },
          },
        },
        "/api/posts/{id}": {
          get: {
            summary: "Get post by ID",
            description: "Retrieve a specific post by its ID",
            tags: ["Posts"],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Post ID",
              },
            ],
            responses: {
              200: {
                description: "Post retrieved successfully",
                content: {
                  "application/json": {
                    schema: PostSchema.PostResponse,
                  },
                },
              },
              404: {
                description: "Post not found",
                content: {
                  "application/json": {
                    schema: CommonSchema.ErrorResponse,
                  },
                },
              },
            },
          },
          put: {
            summary: "Update post",
            description: "Update an existing post's information",
            tags: ["Posts"],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Post ID",
              },
            ],
            requestBody: {
              content: {
                "application/json": {
                  schema: PostSchema.UpdatePost,
                },
              },
            },
            responses: {
              200: {
                description: "Post updated successfully",
                content: {
                  "application/json": {
                    schema: PostSchema.PostResponse,
                  },
                },
              },
              404: {
                description: "Post not found",
                content: {
                  "application/json": {
                    schema: CommonSchema.ErrorResponse,
                  },
                },
              },
            },
          },
          delete: {
            summary: "Delete post",
            description: "Delete a post by its ID",
            tags: ["Posts"],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Post ID",
              },
            ],
            responses: {
              200: {
                description: "Post deleted successfully",
                content: {
                  "application/json": {
                    schema: CommonSchema.SuccessResponse,
                  },
                },
              },
              404: {
                description: "Post not found",
                content: {
                  "application/json": {
                    schema: CommonSchema.ErrorResponse,
                  },
                },
              },
            },
          },
        },
        "/api/posts/author/{authorId}": {
          get: {
            summary: "Get posts by author",
            description: "Retrieve all posts written by a specific author",
            tags: ["Posts"],
            parameters: [
              {
                name: "authorId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Author ID",
              },
            ],
            responses: {
              200: {
                description: "Posts retrieved successfully",
                content: {
                  "application/json": {
                    schema: PostSchema.PostList,
                  },
                },
              },
              404: {
                description: "Author not found",
                content: {
                  "application/json": {
                    schema: CommonSchema.ErrorResponse,
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          User: {
            type: "object",
            properties: {
              id: { type: "string", description: "User ID" },
              email: {
                type: "string",
                format: "email",
                description: "User email address",
              },
              name: {
                type: "string",
                nullable: true,
                description: "User full name",
              },
              createdAt: {
                type: "string",
                format: "date-time",
                description: "User creation date",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                description: "User last update date",
              },
            },
            required: ["id", "email", "createdAt", "updatedAt"],
          },
          CreateUser: {
            type: "object",
            properties: {
              email: {
                type: "string",
                format: "email",
                description: "User email address",
              },
              name: { type: "string", description: "User full name" },
            },
            required: ["email"],
          },
          UpdateUser: {
            type: "object",
            properties: {
              name: { type: "string", description: "User full name" },
            },
          },
          Post: {
            type: "object",
            properties: {
              id: { type: "string", description: "Post ID" },
              title: { type: "string", description: "Post title" },
              content: {
                type: "string",
                nullable: true,
                description: "Post content",
              },
              published: {
                type: "boolean",
                description: "Post published status",
              },
              createdAt: {
                type: "string",
                format: "date-time",
                description: "Post creation date",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                description: "Post last update date",
              },
              authorId: { type: "string", description: "Author ID" },
              author: {
                type: "object",
                properties: {
                  id: { type: "string", description: "Author ID" },
                  email: {
                    type: "string",
                    format: "email",
                    description: "Author email",
                  },
                  name: {
                    type: "string",
                    nullable: true,
                    description: "Author name",
                  },
                },
              },
            },
            required: [
              "id",
              "title",
              "published",
              "createdAt",
              "updatedAt",
              "authorId",
            ],
          },
          CreatePost: {
            type: "object",
            properties: {
              title: { type: "string", description: "Post title" },
              content: { type: "string", description: "Post content" },
              published: {
                type: "boolean",
                description: "Post published status",
              },
              authorId: { type: "string", description: "Author ID" },
            },
            required: ["title", "authorId"],
          },
          UpdatePost: {
            type: "object",
            properties: {
              title: { type: "string", description: "Post title" },
              content: { type: "string", description: "Post content" },
              published: {
                type: "boolean",
                description: "Post published status",
              },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                description: "Request success status",
              },
              error: { type: "string", description: "Error message" },
              meta: {
                type: "object",
                properties: {
                  timestamp: {
                    type: "string",
                    description: "Response timestamp",
                  },
                  path: { type: "string", description: "Request path" },
                },
              },
            },
            required: ["success", "error", "meta"],
          },
          SuccessResponse: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                description: "Request success status",
              },
              message: { type: "string", description: "Response message" },
              meta: {
                type: "object",
                properties: {
                  timestamp: {
                    type: "string",
                    description: "Response timestamp",
                  },
                  path: { type: "string", description: "Request path" },
                },
              },
            },
            required: ["success", "meta"],
          },
        },
      },
    });
  });

  app.get("/swagger", swaggerUI({ url: "/doc" }));

  return app;
}

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { UserService } from "@/domain/services/UserService";
import { CreateUserInput, UpdateUserInput } from "@/domain/entities/User";
import { ResponseMiddleware } from "../middleware/ResponseMiddleware";
import {
  ApiError,
  ForbiddenError,
  UnauthorizedError,
} from "../errors/ApiError";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import {
  UserCreateSchema,
  UserUpdateSchema,
  IdParamSchema,
} from "@/domain/validation/Schemas";

type AuthContext = {
  user: {
    id: string;
    email: string;
  };
};

export class UserController {
  public router = new Hono();

  constructor(private userService: UserService) {
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post(
      "/",
      AuthMiddleware.requireAuth(),
      zValidator("json", UserCreateSchema),
      this.createUser.bind(this),
    );

    this.router.get(
      "/",
      AuthMiddleware.requireAuth(),
      this.getAllUsers.bind(this),
    );

    this.router.get(
      "/:id",
      AuthMiddleware.requireAuth(),
      zValidator("param", IdParamSchema),
      this.getUserById.bind(this),
    );

    this.router.put(
      "/:id",
      AuthMiddleware.requireAuth(),
      zValidator("param", IdParamSchema),
      zValidator("json", UserUpdateSchema),
      this.ensureOwnership.bind(this),
      this.updateUser.bind(this),
    );

    this.router.delete(
      "/:id",
      AuthMiddleware.requireAuth(),
      zValidator("param", IdParamSchema),
      this.ensureOwnership.bind(this),
      this.deleteUser.bind(this),
    );
  }

  private async ensureOwnership(
    c: any,
    next: () => Promise<void>,
  ): Promise<Response | void> {
    const auth = c.get("auth") as AuthContext | undefined;
    const { id } = c.req.valid("param") as { id: string };

    if (!auth?.user?.id) {
      return ResponseMiddleware.sendError(
        c,
        new UnauthorizedError("Authentication required", c.req.path),
      );
    }

    if (auth.user.id !== id) {
      return ResponseMiddleware.sendError(
        c,
        new ForbiddenError(
          "You are not allowed to modify another user",
          c.req.path,
        ),
      );
    }

    await next();
    return;
  }

  private async createUser(c: any) {
    try {
      const input = c.req.valid("json") as CreateUserInput;
      const user = await this.userService.createUser(input);

      return ResponseMiddleware.sendCreated(
        c,
        user,
        "User created successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message);
    }
  }

  private async getAllUsers(c: any) {
    try {
      const users = await this.userService.getAllUsers();

      return ResponseMiddleware.sendSuccess(
        c,
        users,
        "Users retrieved successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }

  private async getUserById(c: any) {
    try {
      const { id } = c.req.valid("param");
      const user = await this.userService.getUserById(id);

      return ResponseMiddleware.sendSuccess(
        c,
        user,
        "User retrieved successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message, 500);
    }
  }

  private async updateUser(c: any) {
    try {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json") as UpdateUserInput;
      const user = await this.userService.updateUser(id, input);

      return ResponseMiddleware.sendUpdated(
        c,
        user,
        "User updated successfully",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message);
    }
  }

  private async deleteUser(c: any) {
    try {
      const { id } = c.req.valid("param");
      await this.userService.deleteUser(id);

      return ResponseMiddleware.sendDeleted(c, "User deleted successfully");
    } catch (error) {
      if (error instanceof ApiError) {
        return ResponseMiddleware.sendError(c, error);
      }

      return ResponseMiddleware.sendError(c, (error as Error).message);
    }
  }
}

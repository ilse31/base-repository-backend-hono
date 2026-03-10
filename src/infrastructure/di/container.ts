import { UserService } from "@/domain/services/UserService";
import { PostService } from "@/domain/services/PostService";
import { AuthService } from "@/domain/services/AuthService";
import { UserRepositoryImpl } from "@/infrastructure/repositories/UserRepositoryImpl";
import { PostRepositoryImpl } from "@/infrastructure/repositories/PostRepositoryImpl";
import { AuthRepositoryImpl } from "@/infrastructure/repositories/AuthRepositoryImpl";
import { JwtService } from "@/infrastructure/auth/JwtService";
import { UserController } from "@/application/controllers/UserController";
import { PostController } from "@/application/controllers/PostController";
import { AuthController } from "@/application/controllers/AuthController";

export class DIContainer {
  private static instance: DIContainer;

  private userRepository: UserRepositoryImpl;
  private postRepository: PostRepositoryImpl;
  private authRepository: AuthRepositoryImpl;

  private userService: UserService;
  private postService: PostService;
  private authService: AuthService;

  private userController: UserController;
  private postController: PostController;
  private authController: AuthController;

  private jwtService: JwtService;

  private constructor() {
    this.userRepository = new UserRepositoryImpl();
    this.postRepository = new PostRepositoryImpl();
    this.authRepository = new AuthRepositoryImpl();

    this.jwtService = new JwtService();

    this.userService = new UserService(this.userRepository);
    this.postService = new PostService(
      this.postRepository,
      this.userRepository,
    );
    this.authService = new AuthService(this.authRepository, this.jwtService);

    this.userController = new UserController(this.userService);
    this.postController = new PostController(this.postService);
    this.authController = new AuthController(this.authService);
  }

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  public getUserController(): UserController {
    return this.userController;
  }

  public getPostController(): PostController {
    return this.postController;
  }

  public getAuthController(): AuthController {
    return this.authController;
  }

  public getUserService(): UserService {
    return this.userService;
  }

  public getPostService(): PostService {
    return this.postService;
  }

  public getAuthService(): AuthService {
    return this.authService;
  }

  public getJwtService(): JwtService {
    return this.jwtService;
  }
}

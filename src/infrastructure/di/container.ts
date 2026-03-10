import { UserService } from "@/domain/services/UserService";
import { PostService } from "@/domain/services/PostService";
import { UserRepositoryImpl } from "@/infrastructure/repositories/UserRepositoryImpl";
import { PostRepositoryImpl } from "@/infrastructure/repositories/PostRepositoryImpl";
import { UserController } from "@/application/controllers/UserController";
import { PostController } from "@/application/controllers/PostController";

export class DIContainer {
  private static instance: DIContainer;

  private userRepository: UserRepositoryImpl;
  private postRepository: PostRepositoryImpl;
  private userService: UserService;
  private postService: PostService;
  private userController: UserController;
  private postController: PostController;

  private constructor() {
    this.userRepository = new UserRepositoryImpl();
    this.postRepository = new PostRepositoryImpl();

    this.userService = new UserService(this.userRepository);
    this.postService = new PostService(
      this.postRepository,
      this.userRepository,
    );

    this.userController = new UserController(this.userService);
    this.postController = new PostController(this.postService);
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

  public getUserService(): UserService {
    return this.userService;
  }

  public getPostService(): PostService {
    return this.postService;
  }
}

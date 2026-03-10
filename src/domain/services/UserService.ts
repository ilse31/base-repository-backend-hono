import { User, CreateUserInput, UpdateUserInput } from "@/domain/entities/User";
import { IUserRepository } from "@/domain/repositories/UserRepository";
import {
  UserNotFoundError,
  UserAlreadyExistsError,
  DatabaseError,
} from "@/application/errors/ApiError";
import { ValidationService } from "@/domain/validation/ValidationService";

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async createUser(input: CreateUserInput): Promise<User> {
    // Validate input using Zod
    const validatedInput = ValidationService.validateUserCreate(input);

    const existingUser = await this.userRepository.findByEmail(
      validatedInput.email,
    );
    if (existingUser) {
      throw new UserAlreadyExistsError(validatedInput.email);
    }

    try {
      return this.userRepository.create(validatedInput);
    } catch (error) {
      throw new DatabaseError(
        "createUser",
        { input: validatedInput },
        "create",
      );
    }
  }

  async getUserById(id: string): Promise<User> {
    const validatedId = ValidationService.validateId(id);

    const user = await this.userRepository.findById(validatedId);
    if (!user) {
      throw new UserNotFoundError(validatedId, "getUserById");
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const validatedEmail = ValidationService.validateEmail(email);
    try {
      return this.userRepository.findByEmail(validatedEmail);
    } catch (error) {
      throw new DatabaseError(
        "findByEmail",
        { email: validatedEmail },
        "getUserByEmail",
      );
    }
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const validatedId = ValidationService.validateId(id);
    const validatedInput = ValidationService.validateUserUpdate(input);

    const user = await this.userRepository.findById(validatedId);
    if (!user) {
      throw new UserNotFoundError(validatedId, "updateUser");
    }

    try {
      return this.userRepository.update(validatedId, validatedInput);
    } catch (error) {
      throw new DatabaseError(
        "updateUser",
        { id: validatedId, input: validatedInput },
        "updateUser",
      );
    }
  }

  async deleteUser(id: string): Promise<void> {
    const validatedId = ValidationService.validateId(id);

    const user = await this.userRepository.findById(validatedId);
    if (!user) {
      throw new UserNotFoundError(validatedId, "deleteUser");
    }

    try {
      this.userRepository.delete(validatedId);
    } catch (error) {
      throw new DatabaseError("deleteUser", { id: validatedId }, "deleteUser");
    }
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}

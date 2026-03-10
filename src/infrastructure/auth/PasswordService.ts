import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";

export class PasswordService {
  private static readonly DEFAULT_ITERATIONS = parseInt(
    process.env.PASSWORD_HASH_ITERATIONS || "100000",
    10,
  );
  private static readonly KEY_LENGTH = 64;
  private static readonly DIGEST = "sha512";
  private static readonly SALT_LENGTH = 16;

  static hashPassword(password: string): string {
    const salt = randomBytes(this.SALT_LENGTH).toString("hex");
    const iterations = this.DEFAULT_ITERATIONS;
    const hash = pbkdf2Sync(
      password,
      salt,
      iterations,
      this.KEY_LENGTH,
      this.DIGEST,
    ).toString("hex");

    return `${iterations}:${salt}:${hash}`;
  }

  static verifyPassword(password: string, storedHash: string): boolean {
    const [iterationsRaw, salt, originalHash] = storedHash.split(":");

    if (!iterationsRaw || !salt || !originalHash) {
      return false;
    }

    const iterations = Number.parseInt(iterationsRaw, 10);
    if (!Number.isFinite(iterations) || iterations <= 0) {
      return false;
    }

    const derivedHash = pbkdf2Sync(
      password,
      salt,
      iterations,
      this.KEY_LENGTH,
      this.DIGEST,
    ).toString("hex");

    const originalBuffer = Buffer.from(originalHash, "hex");
    const derivedBuffer = Buffer.from(derivedHash, "hex");

    if (originalBuffer.length !== derivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(originalBuffer, derivedBuffer);
  }

  static validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

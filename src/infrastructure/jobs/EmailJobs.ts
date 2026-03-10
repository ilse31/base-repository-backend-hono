import { BaseJob, JobResult } from "../queue/JobQueue";
import { EmailService } from "../email/EmailService";

export class WelcomeEmailJob extends BaseJob {
  type = "welcome_email";
  priority = 5;
  maxAttempts = 3;
  delay = 0;

  async execute(data: { email: string; name: string }): Promise<JobResult> {
    try {
      const emailService = EmailService.getInstance();
      const result = await emailService.sendWelcomeEmail(data.email, data.name);

      if (result.success) {
        return { success: true, data: { messageId: result.messageId } };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export class PasswordResetEmailJob extends BaseJob {
  type = "password_reset_email";
  priority = 8;
  maxAttempts = 3;
  delay = 0;

  async execute(data: {
    email: string;
    resetToken: string;
  }): Promise<JobResult> {
    try {
      const emailService = EmailService.getInstance();
      const result = await emailService.sendPasswordResetEmail(
        data.email,
        data.resetToken,
      );

      if (result.success) {
        return { success: true, data: { messageId: result.messageId } };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export class PostPublishedEmailJob extends BaseJob {
  type = "post_published_email";
  priority = 3;
  maxAttempts = 2;
  delay = 0;

  async execute(data: {
    to: string;
    postTitle: string;
    authorName: string;
  }): Promise<JobResult> {
    try {
      const emailService = EmailService.getInstance();
      const result = await emailService.sendPostPublishedEmail(
        data.to,
        data.postTitle,
        data.authorName,
      );

      if (result.success) {
        return { success: true, data: { messageId: result.messageId } };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export class CustomEmailJob extends BaseJob {
  type = "custom_email";
  priority = 5;
  maxAttempts = 3;
  delay = 0;

  async execute(data: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
  }): Promise<JobResult> {
    try {
      const emailService = EmailService.getInstance();
      const result = await emailService.sendEmail(data);

      if (result.success) {
        return { success: true, data: { messageId: result.messageId } };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

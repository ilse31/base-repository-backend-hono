import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter!: nodemailer.Transporter;
  private isConfigured: boolean = false;

  private constructor() {
    this.setupTransporter();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private setupTransporter(): void {
    try {
      if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS
      ) {
        console.warn(
          "  Email service not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.",
        );
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized:
            process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
        },
      });

      this.isConfigured = true;
      console.log("Email service configured successfully");
    } catch (error) {
      console.error("Failed to setup email service:", error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || "Clean Architecture API"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const info = await this.transporter!.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("  Failed to send email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<EmailResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Clean Architecture API! 🎉</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for registering with our Clean Architecture API. Your account has been successfully created.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Account Details:</h3>
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Status:</strong> Active</p>
        </div>
        <p>You can now start using our API services. If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br/>The Clean Architecture API Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: "Welcome to Clean Architecture API!",
      html,
      text: `Welcome to Clean Architecture API! Hi ${userName}, thank you for registering. Your account has been successfully created.`,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<EmailResult> {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request  </h2>
        <p>Hi,</p>
        <p>We received a request to reset your password for your Clean Architecture API account.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email or contact our support team.</p>
        <p>Best regards,<br/>The Clean Architecture API Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: "Password Reset Request - Clean Architecture API",
      html,
      text: `Password reset requested. Click here to reset: ${resetUrl}`,
    });
  }

  async sendPostPublishedEmail(
    to: string,
    postTitle: string,
    authorName: string,
  ): Promise<EmailResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Post Published! 📝</h2>
        <p>Hi,</p>
        <p>${authorName} has published a new post titled "${postTitle}".</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Post Details:</h3>
          <p><strong>Title:</strong> ${postTitle}</p>
          <p><strong>Author:</strong> ${authorName}</p>
          <p><strong>Published:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Check out the latest content on our platform!</p>
        <p>Best regards,<br/>The Clean Architecture API Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `New Post Published: ${postTitle}`,
      html,
      text: `New post published: ${postTitle} by ${authorName}`,
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter!.verify();
      return true;
    } catch (error) {
      console.error("  Email service connection test failed:", error);
      return false;
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }
}

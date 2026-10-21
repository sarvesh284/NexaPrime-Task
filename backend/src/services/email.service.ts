import crypto from 'crypto';
import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  /**
   * Generate a cryptographically secure random token (hex) and its SHA-256 hash
   */
  public generateToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = this.hashToken(token);
    return { token, hash };
  }

  /**
   * Hash a token with SHA-256 for secure database storage
   */
  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Send Email Verification Link
   */
  public async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

    if (!this.transporter) {
      console.log('----------------------------------------------------');
      console.log(`[DEV EMAIL] Verification Email for: ${email}`);
      console.log(`[DEV EMAIL] Link: ${verifyUrl}`);
      console.log('----------------------------------------------------');
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Verify your email address - Store Rating Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
            <h2 style="color: #6366f1;">Welcome to Store Rating Platform</h2>
            <p>Please click the button below to verify your email address and activate your account:</p>
            <div style="margin: 24px 0;">
              <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">This link will expire in 24 hours. If you did not register for an account, please disregard this email.</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 32px;">Or copy and paste this link in your browser:<br/><a href="${verifyUrl}" style="color: #818cf8;">${verifyUrl}</a></p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error(`Failed to send verification email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Send Password Reset Link
   */
  public async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

    if (!this.transporter) {
      console.log('----------------------------------------------------');
      console.log(`[DEV EMAIL] Password Reset Email for: ${email}`);
      console.log(`[DEV EMAIL] Link: ${resetUrl}`);
      console.log('----------------------------------------------------');
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Reset your password - Store Rating Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
            <h2 style="color: #6366f1;">Password Reset Request</h2>
            <p>We received a request to reset your password. Click the button below to proceed:</p>
            <div style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 32px;">Or copy and paste this link in your browser:<br/><a href="${resetUrl}" style="color: #818cf8;">${resetUrl}</a></p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error(`Failed to send password reset email to ${email}:`, error);
      return false;
    }
  }
}

export const emailService = new EmailService();

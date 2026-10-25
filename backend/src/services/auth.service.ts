import { UserModel } from '../models/user.model';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { IUserPayload } from '../types';
import { emailService } from './email.service';

export class AuthService {
  static async register(input: RegisterInput) {
    const existing = await UserModel.findOne({ email: input.email });
    if (existing) {
      const error: any = new Error('An account with this email already exists');
      error.statusCode = 409;
      error.code = 'EMAIL_EXISTS';
      throw error;
    }

    const passwordHash = await hashPassword(input.password);

    // Generate email verification token (24-hour expiry)
    const { token: verificationToken, hash: verificationTokenHash } = emailService.generateToken();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Validate role using strict allowlist (USER or STORE_OWNER only)
    if (input.role && input.role !== 'USER' && input.role !== 'STORE_OWNER') {
      const error: any = new Error('Invalid role specified. Only USER and STORE_OWNER roles are permitted.');
      error.statusCode = 400;
      error.code = 'INVALID_ROLE';
      throw error;
    }

    // Self-registration permits USER (Customer) or STORE_OWNER
    const assignedRole = input.role === 'STORE_OWNER' ? 'STORE_OWNER' : 'USER';
    const newUser = await UserModel.create({
      name: input.name,
      email: input.email,
      address: input.address,
      passwordHash,
      role: assignedRole,
      isActive: true,
      isEmailVerified: false,
      emailVerificationTokenHash: verificationTokenHash,
      emailVerificationExpiresAt: verificationExpiresAt,
      tokenVersion: 1,
    });
    // Send email verification asynchronously (doesn't block registration)
    emailService.sendVerificationEmail(newUser.email, verificationToken).catch((err) => {
      console.error('Failed to dispatch verification email:', err);
    });

    const payload: IUserPayload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      tokenVersion: newUser.tokenVersion,
    };

    const token = signToken(payload);

    return {
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        address: newUser.address,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        createdAt: newUser.createdAt,
      },
      token,
    };
  }

  static async login(input: LoginInput, ip: string = '127.0.0.1', userAgent: string = 'Unknown') {
    const user = await UserModel.findOne({ email: input.email }).select('+passwordHash');
    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (!user.isActive) {
      const error: any = new Error('Your account has been deactivated. Please contact support.');
      error.statusCode = 401;
      error.code = 'ACCOUNT_DEACTIVATED';
      throw error;
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      // Record failed attempt if user exists
      await UserModel.updateOne(
        { _id: user._id },
        {
          $push: {
            loginHistory: {
              $each: [{ ip, userAgent, timestamp: new Date(), status: 'FAILED' }],
              $slice: -20,
            },
          },
        }
      );

      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Record successful login (SEC4)
    await UserModel.updateOne(
      { _id: user._id },
      {
        $push: {
          loginHistory: {
            $each: [{ ip, userAgent, timestamp: new Date(), status: 'SUCCESS' }],
            $slice: -20,
          },
        },
      }
    );

    const payload: IUserPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };

    const token = signToken(payload);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async getLoginHistory(userId: string) {
    const user = await UserModel.findById(userId, 'loginHistory').lean();
    return { loginHistory: (user?.loginHistory || []).reverse() };
  }

  static async getCurrentUser(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user || !user.isActive) {
      const error: any = new Error('User not found or account is deactivated');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      favoritesCount: user.favorites ? user.favorites.length : 0,
      createdAt: user.createdAt,
    };
  }

  /**
   * Request password reset link (anti-enumeration response)
   */
  static async forgotPassword(email: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive) {
      // Always return success to prevent email enumeration
      return {
        message: 'If an account exists with that email, a password reset link has been sent.',
      };
    }

    const { token, hash } = emailService.generateToken();
    user.passwordResetTokenHash = hash;
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await emailService.sendPasswordResetEmail(user.email, token);

    return {
      message: 'If an account exists with that email, a password reset link has been sent.',
    };
  }

  /**
   * Reset password with valid token
   */
  static async resetPassword(token: string, newPassword: string) {
    const tokenHash = emailService.hashToken(token);
    const user = await UserModel.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      const error: any = new Error('Invalid or expired password reset token');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    // Invalidate all existing sessions by incrementing tokenVersion
    user.tokenVersion = (user.tokenVersion || 1) + 1;
    await user.save();

    return {
      message: 'Password has been reset successfully. Please sign in with your new password.',
    };
  }

  /**
   * Verify email address with token
   */
  static async verifyEmail(token: string) {
    const tokenHash = emailService.hashToken(token);
    const user = await UserModel.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      const error: any = new Error('Invalid or expired email verification token');
      error.statusCode = 400;
      error.code = 'INVALID_VERIFICATION_TOKEN';
      throw error;
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    return {
      message: 'Email address verified successfully.',
    };
  }

  /**
   * Resend email verification link
   */
  static async resendVerification(email: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.isEmailVerified || !user.isActive) {
      return {
        message: 'If your account requires verification, a new verification link has been sent.',
      };
    }

    const { token, hash } = emailService.generateToken();
    user.emailVerificationTokenHash = hash;
    user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await emailService.sendVerificationEmail(user.email, token);

    return {
      message: 'If your account requires verification, a new verification link has been sent.',
    };
  }

  /**
   * Revoke all active user sessions (SEC3 / SEC4)
   */
  static async revokeSessions(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    user.tokenVersion = (user.tokenVersion || 1) + 1;
    await user.save();
    return {
      message: 'All active sessions have been revoked successfully.',
    };
  }
}

import { UserModel } from '../models/user.model';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { IUserPayload } from '../types';

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

    // Public registration MUST ALWAYS assign role 'USER'
    const newUser = await UserModel.create({
      name: input.name,
      email: input.email,
      address: input.address,
      passwordHash,
      role: 'USER',
      isActive: true,
    });

    const payload: IUserPayload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    };

    const token = signToken(payload);

    return {
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        address: newUser.address,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      token,
    };
  }

  static async login(input: LoginInput) {
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
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const payload: IUserPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = signToken(payload);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
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
      createdAt: user.createdAt,
    };
  }
}

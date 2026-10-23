import jwt from 'jsonwebtoken';
import { CookieOptions, Response } from 'express';
import { env } from '../config/env';
import { IUserPayload } from '../types';

export const signToken = (payload: IUserPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const verifyToken = (token: string): IUserPayload => {
  return jwt.verify(token, env.JWT_SECRET) as IUserPayload;
};

export const getCookieOptions = (): CookieOptions => {
  const isProduction = env.NODE_ENV === 'production' || env.COOKIE_SECURE;
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : (env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none'),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  };
};

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(env.COOKIE_NAME, token, getCookieOptions());
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(env.COOKIE_NAME, {
    ...getCookieOptions(),
    maxAge: 0,
  });
};

import jwt from 'jsonwebtoken';
import { UserPayload } from '../types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'local_access_secret_1234567890_dev_only';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'local_refresh_secret_1234567890_dev_only';

const ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

export const generateAccessToken = (payload: UserPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRATION as any });
};

export const generateRefreshToken = (payload: UserPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRATION as any });
};

export const verifyAccessToken = (token: string): UserPayload => {
  return jwt.verify(token, ACCESS_SECRET) as UserPayload;
};

export const verifyRefreshToken = (token: string): UserPayload => {
  return jwt.verify(token, REFRESH_SECRET) as UserPayload;
};

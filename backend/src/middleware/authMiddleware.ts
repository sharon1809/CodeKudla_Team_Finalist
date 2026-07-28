import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ message: 'Access token is required' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(403).json({ message: 'Invalid or expired access token', error: error.message });
  }
};

export const authenticate = authenticateToken;

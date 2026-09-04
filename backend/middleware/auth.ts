import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-secret-change-me');

export interface AuthRequest extends Request {
  dbUser?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!JWT_SECRET || !token) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; tokenVersion?: number };
    if (!mongoose.isValidObjectId(decoded.id)) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }
    
    const userResult = await User.findById(decoded.id);
    if (userResult && (decoded.tokenVersion === undefined || decoded.tokenVersion === userResult.tokenVersion)) {
      req.dbUser = userResult;
    } else {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.dbUser?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }
  next();
};

export const requireSeeker = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.dbUser?.role !== 'SEEKER') {
    res.status(403).json({ error: 'Forbidden: Seeker access required' });
    return;
  }
  next();
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

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

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    
    const userResult = await User.findById(decoded.id);
    if (userResult) {
      req.dbUser = userResult;
    } else {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
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

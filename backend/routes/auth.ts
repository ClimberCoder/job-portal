import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role, fullName } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'SEEKER';

    const newUser = new User({
      email,
      passwordHash,
      role: assignedRole
    });
    
    await newUser.save();

    if (assignedRole === 'SEEKER') {
      const newProfile = new Profile({
        userId: newUser._id,
        fullName: fullName || ''
      });
      await newProfile.save();
    }

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: newUser._id, email: newUser.email, role: newUser.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth as any, async (req: AuthRequest, res: Response) => {
  res.json({ user: { id: req.dbUser._id, email: req.dbUser.email, role: req.dbUser.role } });
});

export default router;

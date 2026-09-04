import { Router, Response } from 'express';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { errorResponse, safeString } from '../utils/security.js';

const router = Router();
router.use(requireAuth as any);

router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const q = safeString(req.query.q || req.query.search, 100).replace(/^@/, '');
    const regex = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
    const profiles = regex ? await Profile.find({ $or: [{ fullName: regex }, { headline: regex }, { preferredTitle: regex }, { skills: regex }, { location: regex }] }).select('userId fullName headline preferredTitle location avatarUrl').lean() : [];
    const filter: any = { _id: { $ne: req.dbUser._id }, role: 'SEEKER' };
    if (regex) filter.$or = [{ username: regex }, { email: regex }, { _id: { $in: profiles.map((profile: any) => profile.userId) } }];
    const [users, total] = await Promise.all([
      User.find(filter).select('_id username role').sort({ username: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    const map = new Map(profiles.map((profile: any) => [profile.userId.toString(), profile]));
    res.json({ items: users.map((user: any) => ({ id: user._id, username: user.username, role: user.role, profile: map.get(user._id.toString()) || null })), page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) { errorResponse(res, error); }
});

router.get('/:username', async (req: AuthRequest, res: Response) => {
  try {
    const username = safeString(req.params.username, 30).replace(/^@/, '').toLowerCase();
    const user: any = await User.findOne({ username, role: 'SEEKER' }).select('_id username role').lean();
    if (!user) { res.status(404).json({ error: 'Profile not found' }); return; }
    const profile = await Profile.findOne({ userId: user._id }).select('-resume -resumeVersions -phone -expectedSalary').lean();
    res.json({ ...user, profile });
  } catch (error) { errorResponse(res, error); }
});

export default router;

import { Router, Response } from 'express';
import { Job } from '../models/Job.js';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { Connection } from '../models/Connection.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { errorResponse, safeString } from '../utils/security.js';

const router = Router();
router.use(requireAuth as any);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pagination = (query: any) => ({
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.min(50, Math.max(1, Number(query.limit) || 20)),
});
const activeJobFilter = (userId: any) => ({
  status: 'PUBLISHED',
  $or: [{ visibility: 'PUBLIC' }, { assignedToId: userId }, { assignedSeeker: userId }],
  $and: [
    { $or: [{ deadline: null }, { deadline: { $gt: new Date() } }] },
    { $or: [{ submissionDeadline: null }, { submissionDeadline: { $gt: new Date() } }] },
    { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
  ],
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = pagination(req.query);
    const query = safeString(req.query.q || req.query.search, 120).trim();
    const regex = query ? new RegExp(escapeRegex(query.replace(/^@/, '')), 'i') : null;
    const profileFilter: any = { };
    if (regex) profileFilter.$or = [
      { fullName: regex }, { headline: regex }, { preferredTitle: regex },
      { skills: regex }, { location: regex },
    ];

    const jobFilter: any = activeJobFilter(req.dbUser._id);
    if (regex) {
      jobFilter.$and.push({
        $or: [{ title: regex }, { company: regex }, { description: regex },
          { category: regex }, { skillsRequired: regex }, { location: regex }],
      });
    }

    const [profiles, jobs, jobTotal] = await Promise.all([
      Profile.find(profileFilter).select('userId fullName headline preferredTitle location skills avatarUrl coverPhotoUrl').lean(),
      Job.find(jobFilter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Job.countDocuments(jobFilter),
    ]);
    const peopleFilter: any = { role: 'SEEKER', _id: { $ne: req.dbUser._id } };
    if (regex) {
      peopleFilter.$or = [{ username: regex }, { email: regex }, { _id: { $in: profiles.map((profile: any) => profile.userId) } }];
    }
    const [users, peopleTotal] = await Promise.all([
      User.find(peopleFilter).select('_id username role').sort({ username: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(peopleFilter),
    ]);
    const profileMap = new Map(profiles.map((profile: any) => [profile.userId.toString(), profile]));
    const people = users.map((user: any) => ({
      id: user._id, username: user.username, role: user.role,
      profile: profileMap.get(user._id.toString()) || null,
    }));
    const jobItems = jobs.map((job: any) => ({ ...job, type: 'job' }));
    const personItems = people.map((person: any) => ({ ...person, type: 'person' }));
    res.json({
      query, page, limit,
      people, jobs: jobItems,
      items: [...personItems, ...jobItems],
      totals: { people: peopleTotal, jobs: jobTotal },
      pages: { people: Math.ceil(peopleTotal / limit), jobs: Math.ceil(jobTotal / limit) },
    });
  } catch (error) { errorResponse(res, error); }
});

export const recommendationsRouter = Router();
recommendationsRouter.use(requireAuth as any);
recommendationsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = pagination(req.query);
    const ownProfile: any = await Profile.findOne({ userId: req.dbUser._id }).select('skills').lean();
    const skills = String(ownProfile?.skills || '').split(/[,;\n|]+/).map((skill) => skill.trim().toLowerCase()).filter((skill) => skill.length >= 2).slice(0, 20);
    const connections = await Connection.find({ $or: [{ requesterId: req.dbUser._id }, { recipientId: req.dbUser._id }] }).select('requesterId recipientId').lean();
    const excluded = [req.dbUser._id, ...connections.map((connection: any) => connection.requesterId.toString() === req.dbUser._id.toString() ? connection.recipientId : connection.requesterId)];
    const profileFilter: any = { userId: { $nin: excluded } };
    if (skills.length) profileFilter.$or = skills.map((skill) => ({ skills: new RegExp(escapeRegex(skill), 'i') }));
    const [profiles, total] = await Promise.all([
      Profile.find(profileFilter).select('userId fullName headline preferredTitle location skills avatarUrl coverPhotoUrl').lean(),
      Profile.countDocuments(profileFilter),
    ]);
    const userIds = profiles.map((profile: any) => profile.userId);
    const users = await User.find({ _id: { $in: userIds }, role: 'SEEKER' }).select('_id username role').lean();
    const profileMap = new Map(profiles.map((profile: any) => [profile.userId.toString(), profile]));
    const items = users.map((user: any) => {
      const profile: any = profileMap.get(user._id.toString());
      const candidateSkills = String(profile?.skills || '').toLowerCase();
      const sharedSkills = skills.filter((skill) => candidateSkills.includes(skill));
      return { id: user._id, username: user.username, role: user.role, profile, sharedSkills, matchScore: sharedSkills.length };
    }).sort((a, b) => b.matchScore - a.matchScore || a.username.localeCompare(b.username)).slice((page - 1) * limit, page * limit);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit), basedOnSkills: skills });
  } catch (error) { errorResponse(res, error); }
});

export default router;

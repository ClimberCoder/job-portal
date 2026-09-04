import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { SavedJob } from '../models/SavedJob.js';
import { Interview } from '../models/Interview.js';
import { Notification } from '../models/Notification.js';
import { Connection } from '../models/Connection.js';
import { requireAuth, requireSeeker, AuthRequest } from '../middleware/auth.js';
import { errorResponse, notify, safeString } from '../utils/security.js';
import { sendApplicationConfirmation, sendConnectionNotification } from '../services/emailService.js';

const router = Router();
router.use(requireAuth as any, requireSeeker as any);
const objectId = (value: unknown) => typeof value === 'string' && mongoose.isValidObjectId(value);
const expireJobs = () => Job.updateMany({ status: 'PUBLISHED', $or: [
  { deadline: { $ne: null, $lte: new Date() } }, { submissionDeadline: { $ne: null, $lte: new Date() } }, { expiresAt: { $ne: null, $lte: new Date() } },
] }, { $set: { status: 'EXPIRED' } });
const pageParams = (query: any) => ({
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.min(50, Math.max(1, Number(query.limit) || 12)),
  requested: query.page !== undefined || query.limit !== undefined,
});
const completion = (profile: any) => Math.round(([profile.fullName, profile.headline || profile.preferredTitle, profile.about, profile.location, profile.skills, profile.avatarUrl, profile.resumeUrl].filter(Boolean).length / 7) * 100);

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const applicationIds = await Application.find({ userId: req.dbUser._id }).select('_id').lean();
    const [profile, applications, savedJobs, unreadNotifications, interviews] = await Promise.all([
      Profile.findOne({ userId: req.dbUser._id }).lean(),
      Application.find({ userId: req.dbUser._id }).populate('jobId', 'title company deadline').sort({ createdAt: -1 }).limit(5).lean(),
      SavedJob.countDocuments({ userId: req.dbUser._id }),
      Notification.countDocuments({ userId: req.dbUser._id, readAt: null }),
      Interview.find({ applicationId: { $in: applicationIds.map((application: any) => application._id) }, scheduledAt: { $gte: new Date() }, status: 'SCHEDULED' }).sort({ scheduledAt: 1 }).limit(5).lean(),
    ]);
    const counts = await Application.aggregate([{ $match: { userId: req.dbUser._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    res.json({ profileCompletion: profile ? completion(profile) : 0, savedJobs, unreadNotifications, interviews, recentApplications: applications, statusCounts: counts });
  } catch (error) { errorResponse(res, error); }
});

router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const profile = await Profile.findOne({ userId: req.dbUser._id });
    if (profile && profile.profileCompletion !== completion(profile)) { profile.profileCompletion = completion(profile); await profile.save(); }
    res.json({ ...(profile?.toObject() || {}), email: req.dbUser.email });
  } catch (error) { errorResponse(res, error); }
});

router.patch('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['fullName', 'headline', 'about', 'phone', 'location', 'skills', 'preferredTitle', 'expectedSalary'];
    const updates: Record<string, string> = {};
    for (const key of allowed) updates[key] = safeString(req.body[key], key === 'skills' ? 2000 : 300);
    const profile = await Profile.findOneAndUpdate(
      { userId: req.dbUser._id }, { $set: updates }, { new: true, upsert: true, runValidators: true },
    );
    profile.profileCompletion = completion(profile);
    await profile.save();
    res.json({ ...profile.toObject(), email: req.dbUser.email });
  } catch (error) { errorResponse(res, error); }
});

router.get('/jobs', async (req: AuthRequest, res: Response) => {
  try {
    await expireJobs();
    const { page, limit } = pageParams(req.query);
    const q = safeString(req.query.q, 120);
    const filter: any = {
      status: 'PUBLISHED',
      $and: [
        { $or: [{ visibility: 'PUBLIC' }, { assignedToId: req.dbUser._id }, { assignedSeeker: req.dbUser._id }] },
        { $or: [{ deadline: null }, { deadline: { $gt: new Date() } }] },
        { $or: [{ submissionDeadline: null }, { submissionDeadline: { $gt: new Date() } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
      ],
    };
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$and.push({ $or: [{ title: regex }, { company: regex }, { skillsRequired: regex }, { category: regex }, { location: regex }] });
    }
    if (req.query.category) filter.category = safeString(req.query.category, 100);
    if (req.query.location) filter.location = new RegExp(safeString(req.query.location, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (req.query.employmentType) filter.employmentType = safeString(req.query.employmentType, 100);
    if (req.query.workplaceType) filter.workplaceType = safeString(req.query.workplaceType, 50);
    if (req.query.minSalary) filter.salaryMin = { $gte: Number(req.query.minSalary) || 0 };
    if (req.query.postedAfter) filter.createdAt = { $gte: new Date(String(req.query.postedAfter)) };
    const sortKey = ['createdAt', 'title', 'deadline', 'salaryRange', 'salaryMax'].includes(String(req.query.sort)) ? String(req.query.sort) : 'createdAt';
    const sort: any = { [sortKey]: req.query.order === 'asc' ? 1 : -1 };
    const [jobs, total] = await Promise.all([
      Job.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Job.countDocuments(filter),
    ]);
    const saved = await SavedJob.find({ userId: req.dbUser._id, jobId: { $in: jobs.map((job) => job._id) } }).select('jobId').lean();
    const savedIds = new Set(saved.map((item: any) => item.jobId.toString()));
    res.json({ items: jobs.map((job: any) => ({ ...job, isSaved: savedIds.has(job._id.toString()) })), page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) { errorResponse(res, error); }
});

router.get('/jobs/:id', async (req: AuthRequest, res: Response) => {
  try {
    await expireJobs();
    if (!objectId(req.params.id)) { res.status(400).json({ error: 'Invalid job id' }); return; }
    const job = await Job.findOne({
      _id: req.params.id, status: 'PUBLISHED',
      $or: [{ visibility: 'PUBLIC' }, { assignedToId: req.dbUser._id }, { assignedSeeker: req.dbUser._id }],
      $and: [{ $or: [{ deadline: null }, { deadline: { $gt: new Date() } }] }, { $or: [{ submissionDeadline: null }, { submissionDeadline: { $gt: new Date() } }] }, { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }],
    });
    if (!job) { res.status(404).json({ error: 'Job not found or unavailable' }); return; }
    const saved = await SavedJob.exists({ userId: req.dbUser._id, jobId: job._id });
    res.json({ ...job.toObject(), isSaved: Boolean(saved) });
  } catch (error) { errorResponse(res, error); }
});

router.post('/jobs/:id/save', async (req: AuthRequest, res: Response) => {
  try {
    await expireJobs();
    if (!objectId(req.params.id)) { res.status(404).json({ error: 'Job not found' }); return; }
    const available = await Job.exists({
      _id: req.params.id, status: 'PUBLISHED',
      $or: [{ visibility: 'PUBLIC' }, { assignedToId: req.dbUser._id }, { assignedSeeker: req.dbUser._id }],
      $and: [{ $or: [{ deadline: null }, { deadline: { $gt: new Date() } }] }, { $or: [{ submissionDeadline: null }, { submissionDeadline: { $gt: new Date() } }] }, { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }],
    });
    if (!available) { res.status(404).json({ error: 'Job not found or unavailable' }); return; }
    await SavedJob.updateOne({ userId: req.dbUser._id, jobId: req.params.id }, { $setOnInsert: { userId: req.dbUser._id, jobId: req.params.id } }, { upsert: true });
    res.status(201).json({ saved: true });
  } catch (error) { errorResponse(res, error); }
});

router.delete('/jobs/:id/save', async (req: AuthRequest, res: Response) => {
  await SavedJob.deleteOne({ userId: req.dbUser._id, jobId: req.params.id });
  res.json({ saved: false });
});
router.delete('/saved-jobs/:id', async (req: AuthRequest, res: Response) => {
  const result = await SavedJob.deleteOne({ userId: req.dbUser._id, $or: [{ _id: req.params.id }, { jobId: req.params.id }] });
  if (!result.deletedCount) { res.status(404).json({ error: 'Saved job not found' }); return; }
  res.json({ saved: false });
});

router.post('/saved-jobs', async (req: AuthRequest, res: Response) => {
  const jobId = safeString(req.body.jobId, 100);
  if (!objectId(jobId)) { res.status(400).json({ error: 'Valid jobId is required' }); return; }
  try {
    const job = await Job.findOne({ _id: jobId, status: 'PUBLISHED', $or: [{ visibility: 'PUBLIC' }, { assignedToId: req.dbUser._id }, { assignedSeeker: req.dbUser._id }] });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    const saved = await SavedJob.findOneAndUpdate({ userId: req.dbUser._id, jobId }, { $setOnInsert: { userId: req.dbUser._id, jobId } }, { upsert: true, new: true });
    res.status(201).json(saved);
  } catch (error) { errorResponse(res, error); }
});

router.get('/saved-jobs', async (req: AuthRequest, res: Response) => {
  const { page, limit, requested } = pageParams(req.query);
  const [saved, total] = await Promise.all([
    SavedJob.find({ userId: req.dbUser._id }).populate('jobId').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    SavedJob.countDocuments({ userId: req.dbUser._id }),
  ]);
  const items = saved.map((item: any) => ({ ...item.jobId, isSaved: true, savedAt: item.createdAt, savedJobId: item._id }));
  res.json(requested ? { items, page, limit, total, pages: Math.ceil(total / limit) } : items);
});

router.post('/applications', async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.body;
    if (!objectId(jobId)) { res.status(400).json({ error: 'Valid jobId is required' }); return; }
    await expireJobs();
    const job = await Job.findOne({ _id: jobId, status: 'PUBLISHED', $or: [{ visibility: 'PUBLIC' }, { assignedToId: req.dbUser._id }, { assignedSeeker: req.dbUser._id }], $and: [{ $or: [{ deadline: null }, { deadline: { $gt: new Date() } }] }, { $or: [{ submissionDeadline: null }, { submissionDeadline: { $gt: new Date() } }] }, { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }] });
    if (!job) { res.status(400).json({ error: 'Job is not available for application' }); return; }
    if (await Application.exists({ userId: req.dbUser._id, jobId })) { res.status(409).json({ error: 'You have already applied to this job' }); return; }
    const profile = await Profile.findOne({ userId: req.dbUser._id }).lean();
    const application = await Application.create({
      jobId, userId: req.dbUser._id, job: job._id, seeker: req.dbUser._id, coverLetter: safeString(req.body.coverLetter, 5000),
      resumeSnapshot: profile?.resume || undefined,
      submittedAt: new Date(), applicationDate: new Date(),
      statusHistory: [{ status: 'APPLIED', note: 'Application submitted', changedById: req.dbUser._id }],
    });
    await notify(req.dbUser._id, 'Application submitted', `Your application for ${job.title} was submitted.`, `/dashboard`, 'APPLICATION');
    await sendApplicationConfirmation(req.dbUser.email, job.title);
    res.status(201).json(application);
  } catch (error) { errorResponse(res, error); }
});

router.get('/applications', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, requested } = pageParams(req.query);
    const [apps, total] = await Promise.all([
      Application.find({ userId: req.dbUser._id }).populate('jobId').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Application.countDocuments({ userId: req.dbUser._id }),
    ]);
    const items = apps.map((app: any) => ({ id: app._id, ...app, job: app.jobId }));
    res.json(requested ? { items, page, limit, total, pages: Math.ceil(total / limit) } : items);
  } catch (error) { errorResponse(res, error); }
});

router.get('/applications/:id/timeline', async (req: AuthRequest, res: Response) => {
  const app = await Application.findOne({ _id: req.params.id, userId: req.dbUser._id }).select('status statusHistory');
  if (!app) { res.status(404).json({ error: 'Application not found' }); return; }
  res.json({ status: app.status, history: app.statusHistory || [] });
});

const withdrawApplication = async (req: AuthRequest, res: Response) => {
  try {
    const app: any = await Application.findOne({ _id: req.params.id, userId: req.dbUser._id });
    if (!app) { res.status(404).json({ error: 'Application not found' }); return; }
    if (['SELECTED', 'REJECTED', 'WITHDRAWN'].includes(app.status)) { res.status(409).json({ error: 'This application cannot be withdrawn' }); return; }
    app.status = 'WITHDRAWN';
    app.statusHistory.push({ status: 'WITHDRAWN', note: 'Withdrawn by applicant', changedById: req.dbUser._id, changedAt: new Date() });
    await app.save();
    res.json({ id: app._id, status: app.status, statusHistory: app.statusHistory });
  } catch (error) { errorResponse(res, error); }
};
router.post('/applications/:id/withdraw', withdrawApplication);
router.delete('/applications/:id', withdrawApplication);

router.get('/interviews', async (req: AuthRequest, res: Response) => {
  const { page, limit, requested } = pageParams(req.query);
  const apps = await Application.find({ userId: req.dbUser._id }).select('_id');
  const filter = { applicationId: { $in: apps.map((a) => a._id) } };
  const [interviews, total] = await Promise.all([
    Interview.find(filter).populate({ path: 'applicationId', populate: { path: 'jobId' } }).sort({ scheduledAt: 1 }).skip((page - 1) * limit).limit(limit),
    Interview.countDocuments(filter),
  ]);
  res.json(requested ? { items: interviews, page, limit, total, pages: Math.ceil(total / limit) } : interviews);
});

router.get('/notifications', async (req: AuthRequest, res: Response) => {
  const { page, limit, requested } = pageParams(req.query);
  const filter = { userId: req.dbUser._id };
  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
  ]);
  res.json(requested ? { items: notifications, page, limit, total, pages: Math.ceil(total / limit) } : notifications);
});

router.patch('/notifications/:id/read', async (req: AuthRequest, res: Response) => {
  await Notification.updateOne({ _id: req.params.id, userId: req.dbUser._id }, { $set: { readAt: new Date() } });
  res.json({ read: true });
});
router.patch('/notifications/read-all', async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ userId: req.dbUser._id, readAt: null }, { $set: { readAt: new Date() } });
  res.json({ read: true });
});
router.get('/people', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = pageParams(req.query);
    const q = safeString(req.query.q, 120);
    const filter: any = { role: 'SEEKER', _id: { $ne: req.dbUser._id } };
    const profiles = await Profile.find(q ? { $or: [
      { fullName: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { preferredTitle: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { skills: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { location: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ] } : {}).select('userId fullName preferredTitle location skills avatarUrl coverPhotoUrl').lean();
    const profileIds = profiles.map((profile: any) => profile.userId);
    if (q) filter.$or = [{ _id: { $in: profileIds } }, { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { username: new RegExp(q.replace(/^@/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }];
    const [users, total] = await Promise.all([
      User.find(filter).select('_id email username createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    const profileMap = new Map(profiles.map((profile: any) => [profile.userId.toString(), profile]));
    res.json({ items: users.map((user: any) => ({ id: user._id, username: user.username, profile: profileMap.get(user._id.toString()) || null })), page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) { errorResponse(res, error); }
});

router.get('/people/:id', async (req: AuthRequest, res: Response) => {
  if (!objectId(req.params.id)) { res.status(400).json({ error: 'Invalid person id' }); return; }
  const user: any = await User.findOne({ _id: req.params.id, role: 'SEEKER' }).select('_id email createdAt').lean();
  if (!user) { res.status(404).json({ error: 'Person not found' }); return; }
  const profile = await Profile.findOne({ userId: user._id }).select('-resume -resumeVersions -phone -expectedSalary').lean();
  const connection = await Connection.findOne({ $or: [{ requesterId: req.dbUser._id, recipientId: user._id }, { requesterId: user._id, recipientId: req.dbUser._id }] }).lean();
  res.json({ id: user._id, username: user.username, profile, connection });
});

router.get('/connections', async (req: AuthRequest, res: Response) => {
  const { page, limit } = pageParams(req.query);
  const filter = { $or: [{ requesterId: req.dbUser._id }, { recipientId: req.dbUser._id }] };
  const [connections, total] = await Promise.all([
    Connection.find(filter).populate('requesterId', 'email').populate('recipientId', 'email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Connection.countDocuments(filter),
  ]);
  const ids = connections.map((connection: any) => connection.requesterId?._id?.toString() === req.dbUser._id.toString() ? connection.recipientId?._id : connection.requesterId?._id).filter(Boolean);
  const profiles = await Profile.find({ userId: { $in: ids } }).select('userId fullName preferredTitle avatarUrl coverPhotoUrl location').lean();
  const profileMap = new Map(profiles.map((profile: any) => [profile.userId.toString(), profile]));
  res.json({ items: connections.map((connection: any) => {
    const person: any = connection.requesterId?._id?.toString() === req.dbUser._id.toString() ? connection.recipientId : connection.requesterId;
    return { ...connection, person, direction: person && person._id.toString() === connection.recipientId?._id?.toString() ? 'OUTGOING' : 'INCOMING', profile: person ? profileMap.get(person._id.toString()) : null };
  }), page, limit, total, pages: Math.ceil(total / limit) });
});

router.post('/connections/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!objectId(req.params.id) || req.params.id === req.dbUser._id.toString()) { res.status(400).json({ error: 'Invalid connection target' }); return; }
    const target = await User.findOne({ _id: req.params.id, role: 'SEEKER' });
    if (!target) { res.status(404).json({ error: 'Person not found' }); return; }
    const existing = await Connection.findOne({ $or: [{ requesterId: req.dbUser._id, recipientId: target._id }, { requesterId: target._id, recipientId: req.dbUser._id }] });
    if (existing) { res.status(409).json({ error: `Connection is already ${existing.status.toLowerCase()}` }); return; }
    const connection = await Connection.create({ requesterId: req.dbUser._id, recipientId: target._id });
    await notify(target._id, 'New connection request', `${req.dbUser.email} wants to connect with you.`, '/people', 'CONNECTION');
    await sendConnectionNotification(target.email, `${req.dbUser.username || req.dbUser.email} sent you a connection request.`);
    res.status(201).json(connection);
  } catch (error) { errorResponse(res, error); }
});

router.patch('/connections/:id', async (req: AuthRequest, res: Response) => {
  const status = ['ACCEPTED', 'REJECTED', 'BLOCKED'].includes(req.body.status) ? req.body.status : null;
  if (!status) { res.status(400).json({ error: 'Invalid connection status' }); return; }
  const connection: any = await Connection.findOne({ _id: req.params.id, recipientId: req.dbUser._id });
  if (!connection) { res.status(404).json({ error: 'Connection request not found' }); return; }
  connection.status = status; connection.respondedAt = new Date(); await connection.save();
  await notify(connection.requesterId, `Connection ${status.toLowerCase()}`, `Your connection request was ${status.toLowerCase()}.`, '/connections', 'CONNECTION');
  res.json(connection);
});

router.delete('/connections/:id', async (req: AuthRequest, res: Response) => {
  const result = await Connection.deleteOne({ _id: req.params.id, $or: [{ requesterId: req.dbUser._id }, { recipientId: req.dbUser._id }] });
  if (!result.deletedCount) { res.status(404).json({ error: 'Connection not found' }); return; }
  res.json({ deleted: true });
});

export default router;

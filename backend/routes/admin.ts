import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { Interview } from '../models/Interview.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { audit, errorResponse, notify, safeString } from '../utils/security.js';
import { sendApplicationStatusUpdate, sendInterviewNotification } from '../services/emailService.js';

const router = Router();
router.use(requireAuth as any, requireAdmin as any);
const expireJobs = () => Job.updateMany({ status: 'PUBLISHED', $or: [{ deadline: { $ne: null, $lte: new Date() } }, { submissionDeadline: { $ne: null, $lte: new Date() } }, { expiresAt: { $ne: null, $lte: new Date() } }] }, { $set: { status: 'EXPIRED' } });
const validStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED', 'EXPIRED', 'ARCHIVED'];
const applicationStatuses = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'];
const pagination = (query: any, defaultLimit = 20) => ({
  requested: query.page !== undefined || query.limit !== undefined,
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.min(100, Math.max(1, Number(query.limit) || defaultLimit)),
});

router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    res.json(job);
  } catch (error) { errorResponse(res, error); }
});
const cleanJob = (body: any) => {
  const payload: any = {};
  for (const key of ['title', 'company', 'description', 'category', 'skillsRequired', 'location', 'employmentType', 'salaryRange', 'visibility', 'status', 'companyLogo', 'companyWebsite', 'responsibilities', 'requirements', 'country', 'city', 'workplaceType', 'salaryCurrency', 'salaryPeriod']) {
    if (body[key] !== undefined) payload[key] = safeString(body[key], key === 'description' ? 10000 : 500);
  }
  for (const key of ['requiredSkills', 'preferredSkills']) if (Array.isArray(body[key])) payload[key] = body[key].map((value: unknown) => safeString(value, 100)).filter(Boolean).slice(0, 50);
  for (const key of ['salaryMin', 'salaryMax']) if (body[key] !== undefined && body[key] !== '') payload[key] = Math.max(0, Number(body[key]) || 0);
  if (body.openings !== undefined) payload.openings = Math.max(1, Math.min(100000, Number(body.openings) || 1));
  for (const key of ['deadline', 'expiresAt']) {
    if (body[key]) payload[key] = new Date(body[key]);
    else if (body[key] === null || body[key] === '') payload[key] = null;
  }
  if (body.submissionDeadline !== undefined) payload.submissionDeadline = body.submissionDeadline ? new Date(body.submissionDeadline) : null;
  if (body.assignedToId || body.assignedSeeker) {
    payload.assignedToId = body.assignedToId || body.assignedSeeker;
    payload.assignedSeeker = body.assignedToId || body.assignedSeeker;
  }
  else if (body.assignedToId === '' || body.assignedToId === null) payload.assignedToId = null;
  return payload;
};

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [totalSeekers, totalJobs, activeJobs, totalApplications, pendingApplications, shortlistedCandidates, interviews, recentApplications] = await Promise.all([
      User.countDocuments({ role: 'SEEKER' }), Job.countDocuments(), Job.countDocuments({ status: 'PUBLISHED', $and: [{ $or: [{ deadline: null }, { deadline: { $gt: new Date() } }] }, { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }] }),
      Application.countDocuments(), Application.countDocuments({ status: { $in: ['APPLIED', 'UNDER_REVIEW'] } }), Application.countDocuments({ status: 'SHORTLISTED' }),
      Interview.countDocuments({ status: 'SCHEDULED' }), Application.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }),
    ]);
    res.json({ totalSeekers, totalJobs, activeJobs, totalApplications, pendingApplications, shortlistedCandidates, interviews, recentApplications });
  } catch (error) { errorResponse(res, error); }
});

router.get('/analytics', async (_req: Request, res: Response) => {
  try {
    const byStatus = await Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    const byCategory = await Job.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    const applicationsByDay = await Application.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ byStatus, byCategory, applicationsByDay });
  } catch (error) { errorResponse(res, error); }
});

router.get('/audit-logs', async (req: Request, res: Response) => {
  const { requested, page, limit } = pagination(req.query, 50);
  const [items, total] = await Promise.all([
    AuditLog.find().populate('actorId', 'email role').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(),
  ]);
  res.json(requested ? { items, page, limit, total, pages: Math.ceil(total / limit) } : items);
});

router.get('/seekers', async (req: Request, res: Response) => {
  try {
    const { requested, page, limit } = pagination(req.query, 20);
    const search = safeString(req.query.search || req.query.q, 100);
    const userFilter: any = { role: 'SEEKER' };
    if (search) { const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); userFilter.$or = [{ email: regex }, { username: regex }]; }
    const [seekers, total] = await Promise.all([
      User.find(userFilter).select('-passwordHash').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(userFilter),
    ]);
    const profiles = await Profile.find({ userId: { $in: seekers.map((user) => user._id) } }).lean();
    const profileMap = new Map(profiles.map((profile: any) => [profile.userId.toString(), profile]));
    const items = seekers.map((user: any) => ({ user, profile: profileMap.get(user._id.toString()) || null }));
    res.json(requested ? { items, page, limit, total, pages: Math.ceil(total / limit) } : items);
  } catch (error) { errorResponse(res, error); }
});

router.patch('/seekers/:id/profile', async (req: Request, res: Response) => {
  try {
    const allowed = ['fullName', 'headline', 'about', 'phone', 'location', 'skills', 'preferredTitle', 'expectedSalary'];
    const updates: any = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = safeString(req.body[key], 2000); });
    const profile = await Profile.findOneAndUpdate({ userId: req.params.id }, { $set: updates }, { new: true, upsert: true });
    res.json(profile);
  } catch (error) { errorResponse(res, error); }
});

router.get('/jobs', async (req: Request, res: Response) => {
  await expireJobs();
  const { requested, page, limit } = pagination(req.query, 20);
  const [items, total] = await Promise.all([
    Job.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Job.countDocuments(),
  ]);
  res.json(requested ? { items, page, limit, total, pages: Math.ceil(total / limit) } : items);
});

router.post('/jobs', async (req: AuthRequest, res: Response) => {
  try {
    const payload = cleanJob(req.body);
    if (!payload.title || !payload.company || !payload.description || !payload.category) {
      res.status(400).json({ error: 'Title, company, category, and description are required' }); return;
    }
    if (payload.status && !validStatuses.includes(payload.status)) { res.status(400).json({ error: 'Invalid job status' }); return; }
    if (payload.visibility === 'PRIVATE' && !payload.assignedToId) {
      res.status(400).json({ error: 'Private jobs must be assigned to a seeker' }); return;
    }
    payload.createdById = req.dbUser._id;
    const job = await Job.create(payload);
    await audit(req.dbUser._id, 'CREATE', 'Job', job._id.toString(), { title: job.title }, req.ip);
    res.status(201).json(job);
  } catch (error) { errorResponse(res, error); }
});

router.patch('/jobs/:id', async (req: AuthRequest, res: Response) => {
  try {
    const payload = cleanJob(req.body);
    if (payload.status && !validStatuses.includes(payload.status)) { res.status(400).json({ error: 'Invalid job status' }); return; }
    if (payload.visibility === 'PRIVATE' && payload.assignedToId === null) { res.status(400).json({ error: 'Private jobs must be assigned' }); return; }
    const job = await Job.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true, runValidators: true });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    await audit(req.dbUser._id, 'UPDATE', 'Job', job._id.toString(), payload, req.ip);
    res.json(job);
  } catch (error) { errorResponse(res, error); }
});

const jobLifecycle = (status: string, clearArchive = false) => async (req: AuthRequest, res: Response) => {
  try {
    const updates: any = { status };
    if (status === 'PUBLISHED') updates.publishedAt = new Date();
    if (status === 'CLOSED') updates.closedAt = new Date();
    if (clearArchive) updates.archivedAt = null;
    const job = await Job.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    await audit(req.dbUser._id, status === 'ARCHIVED' ? 'ARCHIVE' : status, 'Job', req.params.id, {}, req.ip);
    res.json(job);
  } catch (error) { errorResponse(res, error); }
};

router.post('/jobs/:id/publish', jobLifecycle('PUBLISHED', true));
router.post('/jobs/:id/unpublish', jobLifecycle('DRAFT'));
router.post('/jobs/:id/close', jobLifecycle('CLOSED'));
router.post('/jobs/:id/reopen', jobLifecycle('PUBLISHED', true));
router.post('/jobs/:id/archive', jobLifecycle('ARCHIVED'));
router.patch('/jobs/:id/publish', jobLifecycle('PUBLISHED', true));
router.patch('/jobs/:id/unpublish', jobLifecycle('DRAFT'));
router.patch('/jobs/:id/close', jobLifecycle('CLOSED'));
router.patch('/jobs/:id/reopen', jobLifecycle('PUBLISHED', true));
router.patch('/jobs/:id/archive', jobLifecycle('ARCHIVED'));

router.post('/jobs/:id/duplicate', async (req: AuthRequest, res: Response) => {
  try {
    const original: any = await Job.findById(req.params.id).lean();
    if (!original) { res.status(404).json({ error: 'Job not found' }); return; }
    delete original._id; delete original.createdAt; delete original.updatedAt;
    original.title = `${original.title} (Copy)`;
    original.status = 'DRAFT';
    original.archivedAt = null;
    original.createdById = req.dbUser._id;
    const duplicate = await Job.create(original);
    await audit(req.dbUser._id, 'DUPLICATE', 'Job', duplicate._id.toString(), { sourceJobId: req.params.id }, req.ip);
    res.status(201).json(duplicate);
  } catch (error) { errorResponse(res, error); }
});

router.delete('/jobs/:id', async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { status: 'ARCHIVED', archivedAt: new Date() }, { new: true });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    await audit(req.dbUser._id, 'ARCHIVE', 'Job', req.params.id, {}, req.ip);
    res.json({ success: true, job });
  } catch (error) { errorResponse(res, error); }
});

router.get('/applications', async (req: Request, res: Response) => {
  try {
    const { requested, page, limit } = pagination(req.query, 20);
    const filter: any = {};
    if (req.query.status) filter.status = safeString(req.query.status, 50);
    if (req.query.jobId && mongoose.isValidObjectId(String(req.query.jobId))) filter.jobId = req.query.jobId;
    if (req.query.userId && mongoose.isValidObjectId(String(req.query.userId))) filter.userId = req.query.userId;
    if (req.query.from || req.query.to) filter.createdAt = { ...(req.query.from ? { $gte: new Date(String(req.query.from)) } : {}), ...(req.query.to ? { $lte: new Date(String(req.query.to)) } : {}) };
    const [apps, total] = await Promise.all([
      Application.find(filter).sort({ createdAt: req.query.order === 'asc' ? 1 : -1 }).skip((page - 1) * limit).limit(limit).populate('jobId', 'title company deadline').populate('userId', 'email username role').lean(),
      Application.countDocuments(filter),
    ]);
    const profiles = await Profile.find({ userId: { $in: apps.map((app) => app.userId?._id).filter(Boolean) } }).lean();
    const profileMap = new Map(profiles.map((profile: any) => [profile.userId.toString(), profile]));
    const items = apps.map((app: any) => ({ id: app._id, ...app, job: app.jobId, user: app.userId, profile: app.userId ? profileMap.get(app.userId._id.toString()) : null }));
    res.json(requested ? { items, page, limit, total, pages: Math.ceil(total / limit) } : items);
  } catch (error) { errorResponse(res, error); }
});

router.patch('/applications/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const status = safeString(req.body.status, 50);
    if (!applicationStatuses.includes(status)) { res.status(400).json({ error: 'Invalid application status' }); return; }
    const app: any = await Application.findById(req.params.id);
    if (!app) { res.status(404).json({ error: 'Application not found' }); return; }
    app.status = status;
    const note = safeString(req.body.note, 1000);
    app.notes = safeString(req.body.internalNote || req.body.notes, 5000) || app.notes;
    app.rejectionReason = safeString(req.body.rejectionReason, 1000) || app.rejectionReason;
    app.statusHistory.push({ status, note, changedById: req.dbUser._id, changedBy: req.dbUser._id, changedAt: new Date() });
    await app.save();
    await notify(app.userId, 'Application status updated', `Your application is now ${status.replace('_', ' ')}.`, '/dashboard', 'APPLICATION');
    const applicant: any = await User.findById(app.userId).select('email');
    if (applicant?.email) await sendApplicationStatusUpdate(applicant.email, status.replace('_', ' '));
    await audit(req.dbUser._id, 'STATUS_CHANGE', 'Application', req.params.id, { status }, req.ip);
    res.json(app);
  } catch (error) { errorResponse(res, error); }
});

router.get('/interviews', async (req: Request, res: Response) => {
  const { requested, page, limit } = pagination(req.query, 20);
  const [items, total] = await Promise.all([
    Interview.find().populate('applicationId').sort({ scheduledAt: 1 }).skip((page - 1) * limit).limit(limit),
    Interview.countDocuments(),
  ]);
  res.json(requested ? { items, page, limit, total, pages: Math.ceil(total / limit) } : items);
});

router.post('/interviews', async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId, scheduledAt } = req.body;
    if (!applicationId || !scheduledAt || new Date(scheduledAt) <= new Date()) { res.status(400).json({ error: 'A future interview time is required' }); return; }
    const app: any = await Application.findById(applicationId);
    if (!app) { res.status(404).json({ error: 'Application not found' }); return; }
    const interview = await Interview.create({ ...req.body, createdById: req.dbUser._id, scheduledAt: new Date(scheduledAt), durationMinutes: Math.min(240, Math.max(15, Number(req.body.durationMinutes) || 30)), notes: safeString(req.body.notes, 2000) });
    await notify(app.userId, 'Interview scheduled', `An interview has been scheduled for ${new Date(scheduledAt).toLocaleString()}.`, '/dashboard', 'INTERVIEW');
    const applicant: any = await User.findById(app.userId).select('email');
    if (applicant?.email) await sendInterviewNotification(applicant.email, `Your interview is scheduled for ${new Date(scheduledAt).toLocaleString()}.`);
    await audit(req.dbUser._id, 'INTERVIEW_SCHEDULED', 'Interview', interview._id.toString(), { applicationId }, req.ip);
    res.status(201).json(interview);
  } catch (error) { errorResponse(res, error); }
});

router.patch('/interviews/:id', async (req: AuthRequest, res: Response) => {
  const interview = await Interview.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!interview) { res.status(404).json({ error: 'Interview not found' }); return; }
  await audit(req.dbUser._id, 'INTERVIEW_UPDATED', 'Interview', req.params.id, {}, req.ip);
  res.json(interview);
});

router.delete('/interviews/:id', async (req: AuthRequest, res: Response) => {
  const interview = await Interview.findByIdAndUpdate(req.params.id, { status: 'CANCELLED' }, { new: true });
  if (!interview) { res.status(404).json({ error: 'Interview not found' }); return; }
  res.json(interview);
});

router.get('/notifications', async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const filter: any = {};
  if (req.query.userId) filter.userId = req.query.userId;
  const [items, total] = await Promise.all([
    Notification.find(filter).populate('userId', 'email role').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
  ]);
  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
});

router.post('/notifications', async (req: AuthRequest, res: Response) => {
  try {
    const title = safeString(req.body.title, 200);
    const message = safeString(req.body.message, 2000);
    if (!title || !message) { res.status(400).json({ error: 'Title and message are required' }); return; }
    const type = safeString(req.body.type, 50) || 'ADMIN';
    const userIds = req.body.userId ? [req.body.userId] : (await User.find({ role: 'SEEKER' }).select('_id').lean()).map((user) => user._id);
    const notifications = await Notification.insertMany(userIds.map((userId) => ({ userId, title, message, type, link: safeString(req.body.link, 300) })));
    await audit(req.dbUser._id, 'CREATE', 'Notification', '', { recipients: userIds.length, title }, req.ip);
    res.status(201).json({ count: notifications.length });
  } catch (error) { errorResponse(res, error); }
});

router.patch('/notifications/:id', async (req: Request, res: Response) => {
  const update: any = {};
  if (req.body.read === true) update.readAt = new Date();
  if (req.body.read === false) update.readAt = null;
  const notification = await Notification.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
  if (!notification) { res.status(404).json({ error: 'Notification not found' }); return; }
  res.json(notification);
});

router.delete('/notifications/:id', async (req: Request, res: Response) => {
  const result = await Notification.findByIdAndDelete(req.params.id);
  if (!result) { res.status(404).json({ error: 'Notification not found' }); return; }
  res.json({ deleted: true });
});

export default router;

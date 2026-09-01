import { Router, Request, Response } from 'express';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin as any);

// Dashboard Stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalSeekers = await User.countDocuments({ role: 'SEEKER' });
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'PUBLISHED' });
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'APPLIED' });
    const shortlistedCandidates = await Application.countDocuments({ status: 'SHORTLISTED' });
    
    res.json({
      totalSeekers,
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      shortlistedCandidates
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Job Seekers Management
router.get('/seekers', async (req: Request, res: Response) => {
  try {
    const seekers = await User.find({ role: 'SEEKER' }).sort({ createdAt: -1 });
    const results = await Promise.all(seekers.map(async (user) => {
      const profile = await Profile.findOne({ userId: user._id });
      return { user, profile };
    }));
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/seekers/:id/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    const profile = await Profile.findOneAndUpdate({ userId }, updates, { returnDocument: 'after', new: false });
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Jobs Management
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const allJobs = await Job.find().sort({ createdAt: -1 });
    res.json(allJobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/jobs', async (req: Request, res: Response) => {
  try {
    const payload = { ...req.body };
    if (payload.assignedToId === '' || payload.assignedToId == null) {
      delete payload.assignedToId;
    }
    if (payload.openings === '' || payload.openings == null) {
      payload.openings = 1;
    }

    const newJob = new Job(payload);
    await newJob.save();
    res.json(newJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    const updateData = { ...req.body };
    if (updateData.assignedToId === '' || updateData.assignedToId == null) {
      delete updateData.assignedToId;
    }
    if (updateData.openings === '' || updateData.openings == null) {
      updateData.openings = 1;
    }

    const updatedJob = await Job.findByIdAndUpdate(jobId, updateData, { new: true });
    res.json(updatedJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    await Job.findByIdAndDelete(jobId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Applications Management
router.get('/applications', async (req: Request, res: Response) => {
  try {
    const apps = await Application.find().sort({ createdAt: -1 })
      .populate('jobId')
      .populate('userId');

    const results = await Promise.all(apps.map(async (app) => {
      const userId = app.userId ? (typeof app.userId === 'object' ? app.userId._id : app.userId) : null;
      const profile = userId ? await Profile.findOne({ userId }) : null;

      return {
        id: app._id,
        status: app.status,
        createdAt: app.createdAt,
        job: app.jobId,
        user: app.userId,
        profile
      };
    }));

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/applications/:id/status', async (req: Request, res: Response) => {
  try {
    const appId = req.params.id;
    const { status } = req.body;
    const updated = await Application.findByIdAndUpdate(appId, { status }, { new: true });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

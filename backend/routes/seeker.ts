import { Router, Response } from 'express';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { requireAuth, requireSeeker, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get profile
router.get('/profile', requireAuth as any, requireSeeker as any, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await Profile.findOne({ userId: req.dbUser._id });
    const user = await User.findById(req.dbUser._id);
    
    res.json({ ...profile?.toObject(), email: user?.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
router.patch('/profile', requireAuth as any, requireSeeker as any, async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    
    const profile = await Profile.findOneAndUpdate(
      { userId: req.dbUser._id },
      { ...updates, updatedAt: new Date() },
      { returnDocument: 'after', upsert: true }
    );
    
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available jobs
router.get('/jobs', requireAuth as any, requireSeeker as any, async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.q as string;
    
    const baseQuery = {
      status: 'PUBLISHED',
      $or: [
        { visibility: 'PUBLIC', assignedToId: null },
        { assignedToId: req.dbUser._id }
      ]
    };
    
    let query: any = baseQuery;
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        ...baseQuery,
        $or: [
          { title: searchRegex },
          { company: searchRegex },
          { skillsRequired: searchRegex }
        ]
      };
    }
    
    const availableJobs = await Job.find(query).sort({ createdAt: -1 });
    res.json(availableJobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job details
router.get('/jobs/:id', requireAuth as any, requireSeeker as any, async (req: AuthRequest, res: Response) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    
    if (job.status !== 'PUBLISHED') {
      res.status(403).json({ error: 'Job is not available' });
      return;
    }
    
    if (job.visibility === 'PRIVATE' && job.assignedToId?.toString() !== req.dbUser._id.toString()) {
      res.status(403).json({ error: 'You do not have access to this job' });
      return;
    }
    
    if (job.assignedToId && job.assignedToId?.toString() !== req.dbUser._id.toString()) {
      res.status(403).json({ error: 'You do not have access to this job' });
      return;
    }
    
    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply to job
router.post('/applications', requireAuth as any, requireSeeker as any, async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.body;
    
    if (!jobId) {
      res.status(400).json({ error: 'jobId is required' });
      return;
    }
    
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'PUBLISHED' || 
        (job.visibility === 'PRIVATE' && job.assignedToId?.toString() !== req.dbUser._id.toString()) || 
        (job.assignedToId && job.assignedToId?.toString() !== req.dbUser._id.toString())) {
      res.status(400).json({ error: 'Job is not available for application' });
      return;
    }
    
    const existingApp = await Application.findOne({ jobId, userId: req.dbUser._id });
    if (existingApp) {
      res.status(400).json({ error: 'You have already applied for this job' });
      return;
    }
    
    const application = new Application({
      jobId,
      userId: req.dbUser._id,
      status: 'APPLIED'
    });
    
    await application.save();
    res.json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my applications
router.get('/applications', requireAuth as any, requireSeeker as any, async (req: AuthRequest, res: Response) => {
  try {
    const myApps = await Application.find({ userId: req.dbUser._id })
      .populate('jobId')
      .sort({ createdAt: -1 });
      
    const results = myApps.map(app => ({
      id: app._id,
      status: app.status,
      createdAt: app.createdAt,
      job: app.jobId
    }));
    
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

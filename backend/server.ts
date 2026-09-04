import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import seekerRoutes from './routes/seeker.js';
import userRoutes from './routes/users.js';
import connectionRoutes from './routes/connections.js';
import searchRoutes, { recommendationsRouter } from './routes/search.js';
import { connectDB } from './config/db.js';
import { verifyEmailTransport } from './utils/security.js';
import { Profile } from './models/Profile.js';
import { Application } from './models/Application.js';
import { requireAuth, AuthRequest } from './middleware/auth.js';

dotenv.config();

async function startServer() {
  await connectDB();
  await verifyEmailTransport();
  
  const app = express();
  // In production, we run on port 3000. In dev, use 5001 to avoid port collisions with stale local servers.
  const PORT = process.env.NODE_ENV === 'production' ? 3000 : (process.env.PORT || 5001);
  
  app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : (process.env.NODE_ENV === 'production' ? false : true), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
  
  // Setup uploads directory
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: { fileSize: Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024), files: 1 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if ((file.fieldname === 'file' || file.fieldname === 'resume') &&
        ['.pdf', '.doc', '.docx'].includes(ext) && allowed.includes(file.mimetype)) return cb(null, true);
      if (['avatar', 'cover'].includes(file.fieldname) && ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && allowed.includes(file.mimetype)) return cb(null, true);
      cb(new Error('Unsupported file type'));
    }
  });

  // Uploaded documents are only available to authenticated sessions.
  const sendUpload = (req: AuthRequest, res: any) => {
    const filename = path.basename(req.params.filename);
    if (filename !== req.params.filename) { res.status(400).json({ error: 'Invalid filename' }); return; }
    const ownership = req.dbUser.role === 'ADMIN'
      ? Profile.exists({ $or: [{ 'resume.storageName': filename }, { 'avatar.storageName': filename }, { 'coverPhoto.storageName': filename }] }).then(Boolean)
        .then(BooleanResult => BooleanResult || Application.exists({ 'resumeSnapshot.storageName': filename }).then(Boolean))
      : Profile.exists({ userId: req.dbUser._id, $or: [
        { userId: req.dbUser._id, 'resume.storageName': filename },
        { userId: req.dbUser._id, 'resumeVersions.storageName': filename },
        { 'avatar.storageName': filename }, { 'coverPhoto.storageName': filename },
      ] }).then(Boolean);
    ownership.then((allowed) => {
      if (!allowed) { res.status(403).json({ error: 'You do not have access to this file' }); return; }
      if (mongoose.isValidObjectId(filename) && mongoose.connection.db) {
        const stream = new mongoose.mongo.GridFSBucket(mongoose.connection.db).openDownloadStream(new mongoose.Types.ObjectId(filename));
        res.setHeader('Content-Disposition', 'inline');
        stream.on('error', () => { if (!res.headersSent) res.status(404).json({ error: 'File not found' }); });
        stream.pipe(res);
      } else {
        res.sendFile(path.join(uploadsDir, filename), (error: Error) => { if (error && !res.headersSent) res.status(404).json({ error: 'File not found' }); });
      }
    }).catch(() => res.status(404).json({ error: 'File not found' }));
  };
  app.get('/uploads/:filename', requireAuth as any, sendUpload);
  app.get('/api/uploads/:filename', requireAuth as any, sendUpload);

  app.delete(['/api/upload/:filename', '/api/uploads/:filename'], requireAuth as any, async (req: AuthRequest, res) => {
    const filename = path.basename(req.params.filename);
    if (filename !== req.params.filename) { res.status(400).json({ error: 'Invalid filename' }); return; }
    const profile = req.dbUser.role === 'ADMIN' ? await Profile.findOne({ $or: [
      { 'resume.storageName': filename }, { 'avatar.storageName': filename }, { 'coverPhoto.storageName': filename },
    ] }) : await Profile.findOne({ userId: req.dbUser._id, $or: [
      { 'resume.storageName': filename }, { 'resumeVersions.storageName': filename },
      { 'avatar.storageName': filename }, { 'coverPhoto.storageName': filename },
    ] });
    if (!profile) { res.status(403).json({ error: 'You do not own or have access to this file' }); return; }
    if (profile) {
      if (profile.resume?.storageName === filename) {
        profile.resumeUrl = '';
        profile.resume = undefined;
      }
      if (profile.avatar?.storageName === filename) { profile.avatarUrl = ''; profile.avatar = undefined; }
      if (profile.coverPhoto?.storageName === filename) { profile.coverPhotoUrl = ''; profile.coverPhoto = undefined; }
      (profile as any).resumeVersions = (profile.resumeVersions || []).filter((version: any) => version.storageName !== filename);
      await profile.save();
    }
    const historicalReference = await Application.exists({ 'resumeSnapshot.storageName': filename });
    if (!historicalReference) {
      if (mongoose.isValidObjectId(filename) && mongoose.connection.db) {
        try { await new mongoose.mongo.GridFSBucket(mongoose.connection.db).delete(new mongoose.Types.ObjectId(filename)); } catch { /* already removed */ }
      } else {
        try { await fs.promises.unlink(path.join(uploadsDir, filename)); } catch { /* already removed */ }
      }
    }
    res.json({ deleted: true });
  });
  
  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/seeker', seekerRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/connections', connectionRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/recommendations', recommendationsRouter);
  app.use('/api/seeker/search', searchRoutes);
  app.use('/api/seeker/recommendations', recommendationsRouter);
  
  // File upload route
  app.post('/api/upload', requireAuth as any, upload.any(), async (req: AuthRequest, res) => {
    const uploadedFile = (req.files as Express.Multer.File[] | undefined)?.[0];
    if (!uploadedFile) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const isAvatar = uploadedFile.fieldname === 'avatar';
    const isCover = uploadedFile.fieldname === 'cover';
    if (!uploadedFile.buffer) { res.status(400).json({ error: 'Invalid upload' }); return; }
    const ext = path.extname(uploadedFile.originalname).toLowerCase();
    const signature = uploadedFile.buffer.subarray(0, 8).toString('hex');
    const validSignature = ext === '.pdf' ? uploadedFile.buffer.subarray(0, 4).toString() === '%PDF' :
      ['.jpg', '.jpeg'].includes(ext) ? signature.startsWith('ffd8ff') :
      ext === '.png' ? signature.startsWith('89504e47') :
      ext === '.webp' ? uploadedFile.buffer.subarray(0, 4).toString() === 'RIFF' :
      ['.doc', '.docx'].includes(ext) ? signature.startsWith('d0cf11e0') || signature.startsWith('504b0304') : false;
    if (!validSignature) { res.status(400).json({ error: 'File content does not match its declared type' }); return; }
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db!);
    const storageId = await new Promise<string>((resolve, reject) => {
      const stream = bucket.openUploadStream(`upload-${crypto.randomBytes(16).toString('hex')}${path.extname(uploadedFile.originalname).toLowerCase()}`, {
        metadata: { ownerId: req.dbUser._id.toString(), category: uploadedFile.fieldname, originalName: path.basename(uploadedFile.originalname), mimeType: uploadedFile.mimetype },
      });
      stream.on('error', reject);
      stream.on('finish', () => resolve(stream.id.toString()));
      Readable.from(uploadedFile.buffer).pipe(stream);
    });
    const metadata = {
      originalName: path.basename(uploadedFile.originalname),
      storageName: storageId,
      mimeType: uploadedFile.mimetype,
      size: uploadedFile.size,
      uploadedAt: new Date(),
    };
    if (isAvatar) {
      await Profile.findOneAndUpdate({ userId: req.dbUser._id }, { avatar: metadata, avatarUrl: `/api/uploads/${storageId}` }, { upsert: true });
    } else if (isCover) {
      await Profile.findOneAndUpdate({ userId: req.dbUser._id }, { coverPhoto: metadata, coverPhotoUrl: `/api/uploads/${storageId}` }, { upsert: true });
    } else {
      const existing = await Profile.findOne({ userId: req.dbUser._id });
      const version = (existing?.resume?.version || 0) + 1;
      const resume = { ...metadata, version };
      await Profile.findOneAndUpdate({ userId: req.dbUser._id }, {
        resume, resumeUrl: `/api/uploads/${storageId}`,
        $push: { resumeVersions: resume },
      }, { upsert: true });
      res.json({ url: `/api/uploads/${storageId}`, ...resume });
      return;
    }
    res.json({ url: `/api/uploads/${storageId}`, ...metadata });
  });
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File is too large (maximum 5 MB)' });
      return;
    }
    if (error) {
      res.status(400).json({ error: error.message || 'Invalid request' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  });
  
  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(process.cwd(), '../frontend/dist');
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }
  
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

startServer();

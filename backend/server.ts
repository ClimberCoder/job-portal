import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import seekerRoutes from './routes/seeker.js';
import { requireAuth } from './middleware/auth.js';
import { connectDB } from './config/db.js';

dotenv.config();

async function startServer() {
  await connectDB();
  
  const app = express();
  // In production, we run on port 3000. In dev, use 5001 to avoid port collisions with stale local servers.
  const PORT = process.env.NODE_ENV === 'production' ? 3000 : (process.env.PORT || 5001);
  
  app.use(cors());
  app.use(express.json());
  
  // Setup uploads directory
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });
  
  // Serve uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/seeker', seekerRoutes);
  
  // File upload route
  app.post('/api/upload', requireAuth as any, upload.single('file'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
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

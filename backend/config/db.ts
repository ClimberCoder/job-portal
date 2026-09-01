import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { Job } from '../models/Job.js';

let mongoServer: MongoMemoryServer;

export const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI?.trim();

    if (uri && uri.includes('<db_password>')) {
      throw new Error('Replace <db_password> in backend/.env with your real MongoDB Atlas password before starting the app.');
    }

    if (!uri) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI is required in production. Add it to backend/.env.');
      }
      console.log('No MONGODB_URI provided. Starting MongoDB Memory Server...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    } else if (uri.includes('localhost') && process.env.NODE_ENV !== 'production') {
      console.log('Starting MongoDB Memory Server for local development...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      await User.create({
        email: 'admin@example.com',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
      });
      console.log('Default admin seeded: admin@example.com / admin123');

      const seekerPasswordHash = await bcrypt.hash('seeker123', 10);
      await User.create({
        email: 'seeker@example.com',
        passwordHash: seekerPasswordHash,
        role: 'SEEKER',
      });
      console.log('Default seeker seeded: seeker@example.com / seeker123');
    }

    const jobCount = await Job.countDocuments();
    if (jobCount === 0) {
      await Job.create([
        {
          title: 'Senior Full Stack Engineer',
          company: 'Nexus Cloud Systems',
          description: 'Lead the development of scalable cloud microservices, Node.js APIs, and modern React user interfaces.',
          category: 'Engineering',
          skillsRequired: 'TypeScript, React, Node.js, MongoDB, Docker',
          location: 'San Francisco, CA (Remote)',
          employmentType: 'Full-Time',
          salaryRange: '$140,000 - $180,000',
          openings: 2,
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
        },
        {
          title: 'Backend Systems Architect',
          company: 'HyperScale Database Inc.',
          description: 'Design and optimize high-throughput distributed database engines and RESTful/gRPC microservices.',
          category: 'Infrastructure',
          skillsRequired: 'MongoDB, Distributed Systems, Go, Express',
          location: 'New York, NY (Hybrid)',
          employmentType: 'Full-Time',
          salaryRange: '$160,000 - $210,000',
          openings: 1,
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
        },
        {
          title: 'Frontend UI/UX Developer',
          company: 'DesignFlow Creative Studio',
          description: 'Craft responsive, accessible web interfaces and interaction patterns using Tailwind CSS and React.',
          category: 'Design',
          skillsRequired: 'React, Tailwind CSS, TypeScript, Figma',
          location: 'Remote',
          employmentType: 'Contract',
          salaryRange: '$90,000 - $120,000',
          openings: 3,
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
        }
      ]);
      console.log('Default sample jobs seeded.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown MongoDB connection error';
    const atlasHint = process.env.MONGODB_URI?.includes('mongodb+srv://')
      ? ' Verify the Atlas password, cluster name, and IP whitelist for this machine (MongoDB Atlas > Network Access).'
      : '';
    console.error(`Database Connection Error: ${message}${atlasHint}`);
    process.exit(1);
  }
};


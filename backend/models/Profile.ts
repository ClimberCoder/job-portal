import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  fullName: { type: String, default: '' },
  headline: { type: String, default: '' },
  about: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  resume: {
    originalName: { type: String, default: '' },
    storageName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: null },
    version: { type: Number, default: 0 },
  },
  resumeVersions: [{
    originalName: String,
    storageName: String,
    mimeType: String,
    size: Number,
    uploadedAt: Date,
    version: Number,
  }],
  avatarUrl: { type: String, default: '' },
  avatar: {
    originalName: { type: String, default: '' },
    storageName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: null },
  },
  coverPhotoUrl: { type: String, default: '' },
  coverPhoto: {
    originalName: { type: String, default: '' },
    storageName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: null },
  },
  skills: { type: String, default: '' },
  preferredTitle: { type: String, default: '' },
  expectedSalary: { type: String, default: '' },
  profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
}, {
  timestamps: true,
});

export const Profile = mongoose.model('Profile', profileSchema);

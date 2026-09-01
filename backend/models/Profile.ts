import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  skills: { type: String, default: '' },
  preferredTitle: { type: String, default: '' },
  expectedSalary: { type: String, default: '' },
}, {
  timestamps: true,
});

export const Profile = mongoose.model('Profile', profileSchema);

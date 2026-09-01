import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['ADMIN', 'SEEKER'],
    default: 'SEEKER',
  },
}, {
  timestamps: true,
});

export const User = mongoose.model('User', userSchema);

import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 30 },
  mode: { type: String, enum: ['VIDEO', 'PHONE', 'ONSITE'], default: 'VIDEO' },
  interviewType: { type: String, enum: ['VIDEO', 'PHONE', 'IN_PERSON'], default: 'VIDEO' },
  location: { type: String, default: '' },
  meetingUrl: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Interview = mongoose.model('Interview', interviewSchema);

import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  status: { type: String, enum: ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'], default: 'APPLIED' },
  submittedAt: { type: Date, default: Date.now, index: true },
  applicationDate: { type: Date, default: Date.now },
  coverLetter: { type: String, default: '' },
  resumeSnapshot: {
    originalName: String,
    storageName: String,
    mimeType: String,
    size: Number,
    version: Number,
    uploadedAt: Date,
  },
  notes: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
  statusHistory: [{
    status: String,
    note: String,
    changedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });
applicationSchema.index({ userId: 1, createdAt: -1 });

export const Application = mongoose.model('Application', applicationSchema);

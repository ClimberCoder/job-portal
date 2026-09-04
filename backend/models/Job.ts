import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  companyLogo: { type: String, default: '' },
  companyWebsite: { type: String, default: '' },
  description: { type: String, required: true },
  category: { type: String, required: true },
  skillsRequired: { type: String, default: '' },
  requiredSkills: { type: [String], default: [] },
  preferredSkills: { type: [String], default: [] },
  responsibilities: { type: String, default: '' },
  requirements: { type: String, default: '' },
  country: { type: String, default: '' },
  city: { type: String, default: '' },
  workplaceType: { type: String, enum: ['REMOTE', 'HYBRID', 'ONSITE', ''], default: '' },
  location: { type: String, default: '' },
  employmentType: { type: String, default: '' },
  salaryRange: { type: String, default: '' },
  salaryMin: { type: Number, min: 0, default: null },
  salaryMax: { type: Number, min: 0, default: null },
  salaryCurrency: { type: String, default: 'USD' },
  salaryPeriod: { type: String, default: 'YEAR' },
  openings: { type: Number, default: 1 },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'EXPIRED', 'ARCHIVED'], default: 'DRAFT', index: true },
  visibility: { type: String, enum: ['PUBLIC', 'PRIVATE'], default: 'PUBLIC', index: true },
  assignedToId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedSeeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deadline: { type: Date, default: null, index: true },
  submissionDeadline: { type: Date, default: null, index: true },
  expiresAt: { type: Date, default: null, index: true },
  archivedAt: { type: Date, default: null },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  publishedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

jobSchema.index({ status: 1, visibility: 1, createdAt: -1 });
jobSchema.index({ title: 'text', company: 'text', description: 'text', skillsRequired: 'text' });

export const Job = mongoose.model('Job', jobSchema);

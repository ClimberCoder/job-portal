import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  skillsRequired: { type: String, default: '' },
  location: { type: String, default: '' },
  employmentType: { type: String, default: '' },
  salaryRange: { type: String, default: '' },
  openings: { type: Number, default: 1 },
  status: { type: String, default: 'PUBLISHED' },
  visibility: { type: String, default: 'PUBLIC' },
  assignedToId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true,
});

export const Job = mongoose.model('Job', jobSchema);

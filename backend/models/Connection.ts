import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'], default: 'PENDING' },
  respondedAt: { type: Date, default: null },
}, { timestamps: true });

connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
export const Connection = mongoose.model('Connection', connectionSchema);

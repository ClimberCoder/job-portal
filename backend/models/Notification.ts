import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, default: 'SYSTEM' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  readAt: { type: Date, default: null },
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);

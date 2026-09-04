import crypto from 'crypto';
import { Response } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import nodemailer from 'nodemailer';

export const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const createToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

export const safeString = (value: unknown, max = 5000) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export const isValidEmail = (value: unknown) =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isStrongPassword = (value: unknown) =>
  typeof value === 'string' && value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

export const sendEmail = async (to: string, subject: string, text: string) => {
  if (!isValidEmail(to)) {
    throw new Error('A valid recipient email is required');
  }
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const password = (process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD || '').replace(/[\s-]/g, '');
  // Console delivery is intentionally development-only. OTPs are never logged in production.
  if ((process.env.EMAIL_MODE || 'console').toLowerCase() === 'console') {
    if (process.env.NODE_ENV !== 'production') console.log(`[email:console] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  if (!host || !user || !password) {
    throw new Error('Email provider is not configured');
  }
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true',
    auth: { user, pass: password },
  });
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || user,
    to, subject, text,
  });
  console.log(`Email submitted successfully: ${info.messageId}`);
};

export const verifyEmailTransport = async () => {
  if ((process.env.EMAIL_MODE || 'console').toLowerCase() === 'console') return;
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const password = (process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD || '').replace(/[\s-]/g, '');
  if (!host || !user || !password) {
    throw new Error('Email provider is not configured');
  }
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true',
    auth: { user, pass: password },
  });
  await transporter.verify();
  transporter.close();
};

export const rateLimit = (windowMs: number, max: number) => {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return (req: { ip?: string }, res: Response, next: () => void) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    current.count += 1;
    if (current.count > max) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }
    next();
  };
};

export const audit = (actorId: unknown, action: string, entityType: string, entityId = '', metadata: Record<string, unknown> = {}, ip = '') =>
  AuditLog.create({ actorId: actorId as any, action, entityType, entityId, metadata, ip }).catch((error) =>
    console.error('Audit log failed', error));

export const notify = (userId: unknown, title: string, message: string, link = '', type = 'SYSTEM') =>
  Notification.create({ userId: userId as any, title, message, link, type }).catch((error) =>
    console.error('Notification failed', error));

export const errorResponse = (res: Response, error: unknown) => {
  if ((error as { name?: string })?.name === 'ValidationError') {
    res.status(400).json({ error: 'Invalid request data' });
    return;
  }
  if ((error as { name?: string })?.name === 'CastError') {
    res.status(400).json({ error: 'Invalid identifier or request data' });
    return;
  }
  if ((error as { code?: number })?.code === 11000) {
    res.status(409).json({ error: 'Resource already exists' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
};

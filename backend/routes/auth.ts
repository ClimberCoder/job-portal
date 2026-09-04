import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { audit, createToken, errorResponse, hashToken, isStrongPassword, isValidEmail, notify, rateLimit, safeString, sendEmail } from '../utils/security.js';

dotenv.config();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-secret-change-me');
const verificationRequired = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
const loginOtpRequired = process.env.LOGIN_OTP_REQUIRED !== 'false';
const OTP_TTL = 10 * 60 * 1000;
const RESEND_COOLDOWN = 45 * 1000;
const publicUser = (user: any) => ({ id: user._id, email: user.email, role: user.role, username: user.username, emailVerified: user.emailVerified });
const issueToken = (user: any) => jwt.sign(
  { id: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion || 0 },
  JWT_SECRET,
  { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any },
);
const createOtp = () => String(crypto.randomInt(100000, 1000000));
const safeEqualHash = (actual: string | null | undefined, expected: string) =>
  Boolean(actual && actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected)));
const usernameFrom = (value: unknown, email: string) => {
  const candidate = safeString(value, 30).toLowerCase().replace(/[^a-z0-9_]/g, '');
  return (candidate || email.split('@')[0].replace(/[^a-z0-9_]/g, '')).slice(0, 30);
};
const sendCode = async (user: any, kind: 'verification' | 'login' | 'reset') => {
  const code = createOtp();
  const hash = hashToken(code);
  const expiresAt = new Date(Date.now() + OTP_TTL);
  if (kind === 'verification') {
    user.verificationCodeHash = hash; user.verificationCodeExpiresAt = expiresAt; user.verificationAttempts = 0; user.lastVerificationCodeSentAt = new Date();
  } else if (kind === 'login') {
    user.loginOtpHash = hash; user.loginOtpExpiresAt = expiresAt; user.loginOtpAttempts = 0; user.lastLoginCodeSentAt = new Date();
  } else {
    user.passwordResetCodeHash = hash; user.passwordResetCodeExpiresAt = expiresAt; user.passwordResetAttempts = 0; user.lastPasswordResetCodeSentAt = new Date();
  }
  await user.save();
  await sendEmail(user.email, `Your StackPortal ${kind} code`, `Your StackPortal verification code is ${code}. It is valid for 10 minutes.`);
};
const cooldown = (date: Date | null | undefined) => date && Date.now() - date.getTime() < RESEND_COOLDOWN;

router.post('/register', rateLimit(15 * 60 * 1000, 20), async (req: Request, res: Response) => {
  try {
    const email = safeString(req.body.email, 254).toLowerCase();
    const password = req.body.password;
    const fullName = safeString(req.body.fullName, 120);
    const username = usernameFrom(req.body.username, email);
    if (!isValidEmail(email) || !isStrongPassword(password) || password !== req.body.confirmPassword || !fullName || !/^[a-z0-9_]{3,30}$/.test(username)) {
      res.status(400).json({ error: 'Name, valid username, email and a strong password are required' }); return;
    }
    if (await User.exists({ $or: [{ email }, { username }] })) {
      res.status(409).json({ error: 'Email or username already exists' }); return;
    }
    const user = await User.create({ email, username, passwordHash: await bcrypt.hash(password, 12), role: 'SEEKER', emailVerified: !verificationRequired });
    await Profile.create({ userId: user._id, fullName });
    if (verificationRequired) {
      await sendCode(user, 'verification');
      res.status(201).json({ requiresEmailVerification: true, user: publicUser(user) }); return;
    }
    await audit(user._id, 'REGISTER', 'User', user._id.toString(), {}, req.ip);
    res.status(201).json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) { errorResponse(res, error); }
});

router.post('/verify-email', rateLimit(15 * 60 * 1000, 20), async (req: Request, res: Response) => {
  try {
    const email = safeString(req.body.email, 254).toLowerCase();
    const code = safeString(req.body.code || req.body.otp, 12);
    const token = safeString(req.body.token, 200);
    const user: any = await User.findOne({ email }).select('+verificationCodeHash +verificationCodeExpiresAt +verificationAttempts +emailVerificationTokenHash +emailVerificationExpiresAt');
    const hash = code ? hashToken(code) : hashToken(token);
    const codeValid = user?.verificationCodeHash && user.verificationCodeExpiresAt && user.verificationCodeExpiresAt > new Date() && (user.verificationAttempts || 0) < 5 && safeEqualHash(user.verificationCodeHash, hash);
    const legacyValid = token && user?.emailVerificationTokenHash && user.emailVerificationExpiresAt && user.emailVerificationExpiresAt > new Date() && safeEqualHash(user.emailVerificationTokenHash, hash);
    if (!user || (!codeValid && !legacyValid)) {
      if (user) { user.verificationAttempts = (user.verificationAttempts || 0) + 1; await user.save(); }
      res.status(400).json({ error: 'Verification code is invalid or expired' }); return;
    }
    user.emailVerified = true; user.emailVerifiedAt = new Date();
    user.verificationCodeHash = null; user.verificationCodeExpiresAt = null; user.emailVerificationTokenHash = null; user.emailVerificationExpiresAt = null;
    await user.save();
    await notify(user._id, 'Email verified', 'Your StackPortal email has been verified.', '/login', 'EMAIL_VERIFICATION');
    res.json({ verified: true, user: publicUser(user), message: 'Email verified successfully. You can now sign in.' });
  } catch (error) { errorResponse(res, error); }
});

router.post('/resend-verification', rateLimit(15 * 60 * 1000, 10), async (req: Request, res: Response) => {
  try {
    const email = safeString(req.body.email, 254).toLowerCase();
    const user: any = await User.findOne({ email }).select('+lastVerificationCodeSentAt');
    if (user && !user.emailVerified && !cooldown(user.lastVerificationCodeSentAt)) await sendCode(user, 'verification');
    res.json({ message: 'If that account exists, a verification code has been sent' });
  } catch (error) { errorResponse(res, error); }
});

router.post('/login', rateLimit(15 * 60 * 1000, 20), async (req: Request, res: Response) => {
  try {
    const email = safeString(req.body.email, 254).toLowerCase();
    const user: any = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    if (verificationRequired && !user.emailVerified) { res.status(403).json({ success: false, code: 'EMAIL_NOT_VERIFIED', error: 'Please verify your email before signing in.' }); return; }
    if (loginOtpRequired) { await sendCode(user, 'login'); res.json({ requiresOtp: true, challenge: 'email', message: 'A sign-in code was sent to your email' }); return; }
    user.lastLoginAt = new Date(); await user.save(); await audit(user._id, 'LOGIN', 'User', user._id.toString(), {}, req.ip);
    res.json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) { errorResponse(res, error); }
});

router.post('/login/request-otp', rateLimit(15 * 60 * 1000, 20), async (req: Request, res: Response) => {
  try {
    const email = safeString(req.body.email, 254).toLowerCase();
    const user: any = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash)) || (verificationRequired && !user.emailVerified)) {
      res.status(401).json({ error: 'Invalid credentials' }); return;
    }
    await sendCode(user, 'login');
    res.json({ requiresOtp: true, message: 'A sign-in code was sent to your email' });
  } catch (error) { errorResponse(res, error); }
});

router.post('/login/verify-otp', rateLimit(15 * 60 * 1000, 30), async (req: Request, res: Response) => {
  try {
    const email = safeString(req.body.email, 254).toLowerCase();
    const otp = safeString(req.body.otp || req.body.code, 12);
    const user: any = await User.findOne({ email }).select('+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts');
    const valid = user?.loginOtpHash && user.loginOtpExpiresAt && user.loginOtpExpiresAt > new Date() && (user.loginOtpAttempts || 0) < 5 && safeEqualHash(user.loginOtpHash, hashToken(otp));
    if (!user || !valid) { if (user) { user.loginOtpAttempts = (user.loginOtpAttempts || 0) + 1; await user.save(); } res.status(401).json({ error: 'Invalid or expired sign-in code' }); return; }
    user.loginOtpHash = null; user.loginOtpExpiresAt = null; user.loginOtpAttempts = 0; user.lastLoginAt = new Date(); await user.save();
    await audit(user._id, 'LOGIN_OTP', 'User', user._id.toString(), {}, req.ip);
    res.json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) { errorResponse(res, error); }
});

router.post('/forgot-password', rateLimit(15 * 60 * 1000, 10), async (req: Request, res: Response) => {
  try {
    const email = safeString(req.body.email, 254).toLowerCase();
    const user: any = await User.findOne({ email }).select('+passwordResetCodeHash +passwordResetCodeExpiresAt +passwordResetAttempts +lastPasswordResetCodeSentAt');
    if (user && !cooldown(user.lastPasswordResetCodeSentAt)) await sendCode(user, 'reset');
    res.json({ message: 'If that account exists, a password reset code has been sent' });
  } catch (error) { errorResponse(res, error); }
});

router.post('/verify-reset-code', rateLimit(15 * 60 * 1000, 20), async (req: Request, res: Response) => {
  const email = safeString(req.body.email, 254).toLowerCase();
  const code = safeString(req.body.code || req.body.otp, 12);
  const user: any = await User.findOne({ email }).select('+passwordResetCodeHash +passwordResetCodeExpiresAt +passwordResetAttempts');
  const valid = user?.passwordResetCodeHash && user.passwordResetCodeExpiresAt > new Date() && (user.passwordResetAttempts || 0) < 5 && safeEqualHash(user.passwordResetCodeHash, hashToken(code));
  if (!user || !valid) { if (user) { user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1; await user.save(); } res.status(400).json({ error: 'Reset code is invalid or expired' }); return; }
  res.json({ verified: true });
});

router.post('/reset-password', rateLimit(15 * 60 * 1000, 20), async (req: Request, res: Response) => {
  try {
    const email = safeString(req.body.email, 254).toLowerCase();
    const code = safeString(req.body.code || req.body.otp, 12);
    const token = safeString(req.body.token, 200);
    if (!isStrongPassword(req.body.password)) { res.status(400).json({ error: 'Password must be at least 8 characters and contain a number' }); return; }
    const user: any = await User.findOne({ email }).select('+passwordResetCodeHash +passwordResetCodeExpiresAt +passwordResetAttempts +passwordResetTokenHash +passwordResetExpiresAt');
    const codeValid = code && user?.passwordResetCodeHash && user.passwordResetCodeExpiresAt > new Date() && (user.passwordResetAttempts || 0) < 5 && safeEqualHash(user.passwordResetCodeHash, hashToken(code));
    const tokenValid = token && user?.passwordResetTokenHash && user.passwordResetExpiresAt > new Date() && safeEqualHash(user.passwordResetTokenHash, hashToken(token));
    if (!user || (!codeValid && !tokenValid)) { res.status(400).json({ error: 'Reset code is invalid or expired' }); return; }
    user.passwordHash = await bcrypt.hash(req.body.password, 12); user.passwordResetCodeHash = null; user.passwordResetCodeExpiresAt = null; user.passwordResetTokenHash = null; user.passwordResetExpiresAt = null; user.tokenVersion += 1;
    await user.save(); res.json({ message: 'Password reset successfully' });
  } catch (error) { errorResponse(res, error); }
});

router.patch('/password', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const account: any = await User.findById(req.dbUser._id).select('+passwordHash');
    if (!account || !isStrongPassword(req.body.newPassword) || !(await bcrypt.compare(req.body.currentPassword || '', account.passwordHash))) { res.status(400).json({ error: 'Current password or new password is invalid' }); return; }
    account.passwordHash = await bcrypt.hash(req.body.newPassword, 12); account.tokenVersion += 1; await account.save();
    res.json({ message: 'Password changed successfully. Please sign in again.' });
  } catch (error) { errorResponse(res, error); }
});

router.patch('/settings', requireAuth as any, async (req: AuthRequest, res: Response) => {
  const preferences = req.body.notificationPreferences;
  const privacy = req.body.privacySettings;
  if (preferences && typeof preferences === 'object') req.dbUser.notificationPreferences = preferences;
  if (privacy && typeof privacy === 'object') req.dbUser.privacySettings = privacy;
  await req.dbUser.save();
  res.json({ notificationPreferences: req.dbUser.notificationPreferences, privacySettings: req.dbUser.privacySettings });
});

router.delete('/account', requireAuth as any, async (req: AuthRequest, res: Response) => {
  req.dbUser.deactivatedAt = new Date();
  req.dbUser.email = `deactivated-${req.dbUser._id}@deleted.invalid`;
  req.dbUser.username = `deleted_${req.dbUser._id.toString().slice(-20)}`;
  req.dbUser.tokenVersion += 1;
  await req.dbUser.save();
  res.json({ message: 'Account deactivated. Historical applications have been preserved.' });
});

router.post('/logout', requireAuth as any, async (req: AuthRequest, res: Response) => { req.dbUser.tokenVersion += 1; await req.dbUser.save(); res.json({ message: 'Logged out' }); });
router.post('/logout-all', requireAuth as any, async (req: AuthRequest, res: Response) => { req.dbUser.tokenVersion += 1; await req.dbUser.save(); res.json({ message: 'All sessions revoked' }); });
router.get('/me', requireAuth as any, async (req: AuthRequest, res: Response) => res.json({ user: publicUser(req.dbUser) }));

export default router;

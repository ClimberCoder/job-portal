import { sendEmail } from '../utils/security.js';

export const sendVerificationCode = (to: string, code: string) =>
  sendEmail(to, 'Verify your StackPortal email', `Your StackPortal verification code is ${code}. It is valid for 10 minutes.`);
export const sendLoginCode = (to: string, code: string) =>
  sendEmail(to, 'Your StackPortal sign-in code', `Your StackPortal verification code is ${code}. It is valid for 10 minutes.`);
export const sendPasswordResetCode = (to: string, code: string) =>
  sendEmail(to, 'Reset your StackPortal password', `Your StackPortal verification code is ${code}. It is valid for 10 minutes.`);
export const sendApplicationConfirmation = (to: string, jobTitle: string) =>
  sendEmail(to, 'Application received', `Your application for ${jobTitle} was received.`);
export const sendApplicationStatusUpdate = (to: string, status: string) =>
  sendEmail(to, 'Application status updated', `Your application status is now ${status}.`);
export const sendInterviewNotification = (to: string, details: string) =>
  sendEmail(to, 'Interview scheduled', details);
export const sendDeadlineReminder = (to: string, jobTitle: string) =>
  sendEmail(to, 'Application deadline reminder', `The application deadline for ${jobTitle} is approaching.`);
export const sendConnectionNotification = (to: string, message: string) =>
  sendEmail(to, 'Connection update', message);

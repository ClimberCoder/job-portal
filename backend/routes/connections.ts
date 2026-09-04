import { Router, Response } from 'express';
import { Connection } from '../models/Connection.js';
import { User } from '../models/User.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { errorResponse, notify, safeString } from '../utils/security.js';

const router = Router();
router.use(requireAuth as any);
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const recipientId = safeString(req.body.recipientId || req.body.userId, 100);
    if (!recipientId || recipientId === req.dbUser._id.toString()) { res.status(400).json({ error: 'Invalid connection target' }); return; }
    const recipient: any = await User.findOne({ _id: recipientId, role: 'SEEKER' });
    if (!recipient) { res.status(404).json({ error: 'Person not found' }); return; }
    const existing = await Connection.findOne({ $or: [{ requesterId: req.dbUser._id, recipientId }, { requesterId: recipientId, recipientId: req.dbUser._id }] });
    if (existing) { res.status(409).json({ error: 'Connection already exists' }); return; }
    const connection = await Connection.create({ requesterId: req.dbUser._id, recipientId });
    await notify(recipientId, 'New connection request', `${req.dbUser.username || req.dbUser.email} wants to connect with you.`, '/connections', 'CONNECTION');
    res.status(201).json(connection);
  } catch (error) { errorResponse(res, error); }
});
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const status = ['ACCEPTED', 'REJECTED', 'CANCELLED'].includes(req.body.status) ? req.body.status : '';
    const connection: any = await Connection.findOne({ _id: req.params.id, $or: [{ recipientId: req.dbUser._id }, { requesterId: req.dbUser._id }] });
    if (!connection) { res.status(404).json({ error: 'Connection not found' }); return; }
    if (status === 'CANCELLED' && connection.requesterId.toString() !== req.dbUser._id.toString()) { res.status(403).json({ error: 'Only the requester can cancel' }); return; }
    if (['ACCEPTED', 'REJECTED'].includes(status) && connection.recipientId.toString() !== req.dbUser._id.toString()) { res.status(403).json({ error: 'Only the recipient can respond' }); return; }
    connection.status = status; connection.respondedAt = new Date(); await connection.save();
    const notifyUser = connection.requesterId.toString() === req.dbUser._id.toString() ? connection.recipientId : connection.requesterId;
    await notify(notifyUser, `Connection ${status.toLowerCase()}`, `Your connection request was ${status.toLowerCase()}.`, '/connections', 'CONNECTION');
    res.json(connection);
  } catch (error) { errorResponse(res, error); }
});
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const result = await Connection.deleteOne({ _id: req.params.id, $or: [{ requesterId: req.dbUser._id }, { recipientId: req.dbUser._id }] });
  if (!result.deletedCount) { res.status(404).json({ error: 'Connection not found' }); return; }
  res.json({ deleted: true });
});
export default router;

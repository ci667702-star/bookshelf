import { Router } from 'express';
import * as c from '../controllers/sharedController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { joinLimiter } from '../middlewares/rateLimits.js';
import { idParam } from '../utils/validators.js';

const r = Router();
r.use(requireAuth);

r.post('/join', joinLimiter, validate({ body: c.joinSchema }), c.joinShared);
r.get('/', validate({ query: c.listSharedQuery }), c.listShared);
r.post('/', validate({ body: c.createSharedSchema }), c.createShared);
r.get('/:id', validate({ params: idParam }), c.getShared);
r.put('/:id', validate({ params: idParam, body: c.updateSharedSchema }), c.updateShared);
r.delete('/:id', validate({ params: idParam }), c.deleteShared);
r.delete('/:id/leave', validate({ params: idParam }), c.leaveShared);
r.post('/:id/invite-code', validate({ params: idParam }), c.regenerateCode);
r.delete('/:id/members/:userId', validate({ params: c.memberParams }), c.removeMember);
r.post('/:id/items', validate({ params: idParam, body: c.addItemSchema }), c.addItem);
r.delete('/:id/items/:itemId', validate({ params: c.itemParams }), c.removeItem);

export default r;

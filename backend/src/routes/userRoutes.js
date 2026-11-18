import { Router } from 'express';
import * as c from '../controllers/userController.js';
import { optionalAuth, requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimits.js';
import { idParam } from '../utils/validators.js';

const r = Router();

r.put('/me', requireAuth, validate({ body: c.updateMeSchema }), c.updateMe);
r.put('/me/password', requireAuth, authLimiter, validate({ body: c.changePasswordSchema }), c.changePassword);
r.delete('/me', requireAuth, authLimiter, validate({ body: c.deleteMeSchema }), c.deleteMe);
r.get('/:id', optionalAuth, validate({ params: idParam }), c.getProfile);

export default r;

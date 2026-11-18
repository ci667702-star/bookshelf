import { Router } from 'express';
import * as c from '../controllers/bookshelfController.js';
import { optionalAuth, requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParam } from '../utils/validators.js';

const r = Router();

r.get('/', optionalAuth, validate({ query: c.listShelvesQuery }), c.listShelves);
r.post('/', requireAuth, validate({ body: c.createShelfSchema }), c.createShelf);
r.get('/:id', optionalAuth, validate({ params: idParam }), c.getShelf);
r.put('/:id', requireAuth, validate({ params: idParam, body: c.updateShelfSchema }), c.updateShelf);
r.delete('/:id', requireAuth, validate({ params: idParam, query: c.deleteShelfQuery }), c.deleteShelf);

r.get('/:id/decoration', optionalAuth, validate({ params: idParam }), c.getDecoration);
r.put('/:id/decoration', requireAuth, validate({ params: idParam, body: c.decorationSchema }), c.updateDecoration);

export default r;

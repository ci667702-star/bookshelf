import { Router } from 'express';
import * as c from '../controllers/bookController.js';
import { optionalAuth, requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParam } from '../utils/validators.js';

const r = Router();

r.get('/', requireAuth, validate({ query: c.listBooksQuery }), c.listBooks);
r.post('/', requireAuth, validate({ body: c.createBookSchema }), c.createBook);
r.get('/:id', optionalAuth, validate({ params: idParam }), c.getBook);
r.put('/:id', requireAuth, validate({ params: idParam, body: c.updateBookSchema }), c.updateBook);
r.delete('/:id', requireAuth, validate({ params: idParam }), c.deleteBook);

export default r;

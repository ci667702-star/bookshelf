import { Router } from 'express';
import * as c from '../controllers/reviewController.js';
import { optionalAuth, requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParam } from '../utils/validators.js';

const r = Router();

r.get('/', optionalAuth, validate({ query: c.listReviewsQuery }), c.listReviews);
r.post('/', requireAuth, validate({ body: c.createReviewSchema }), c.createReview);
r.get('/:id', optionalAuth, validate({ params: idParam }), c.getReview);
r.put('/:id', requireAuth, validate({ params: idParam, body: c.updateReviewSchema }), c.updateReview);
r.delete('/:id', requireAuth, validate({ params: idParam }), c.deleteReview);

r.post('/:id/like', requireAuth, validate({ params: idParam }), c.toggleLike);
r.get('/:id/comments', optionalAuth, validate({ params: idParam }), c.listComments);
r.post('/:id/comments', requireAuth, validate({ params: idParam, body: c.commentSchema }), c.createComment);
r.delete('/:id/comments/:commentId', requireAuth, validate({ params: c.commentParams }), c.deleteComment);

export default r;

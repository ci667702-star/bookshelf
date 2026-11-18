import { Router } from 'express';
import * as c from '../controllers/readingController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParam } from '../utils/validators.js';

const r = Router();
r.use(requireAuth);

// 고정 경로를 /:id 보다 먼저
r.get('/calendar', validate({ query: c.calendarQuery }), c.calendar);
r.get('/marathon', c.marathon);
r.delete('/logs/:logId', validate({ params: c.logIdParam }), c.deleteLog);
r.get('/timer', c.getTimer);
r.post('/timer/stop', validate({ body: c.stopTimerSchema }), c.stopTimer);
r.delete('/timer', c.cancelTimer);
r.post('/:id/timer', validate({ params: idParam }), c.startTimer);

r.get('/', validate({ query: c.listReadingQuery }), c.listReading);
r.post('/', validate({ body: c.createReadingSchema }), c.createReading);
r.put('/:id', validate({ params: idParam, body: c.updateReadingSchema }), c.updateReading);
r.delete('/:id', validate({ params: idParam }), c.deleteReading);
r.get('/:id/logs', validate({ params: idParam }), c.listLogs);
r.post('/:id/logs', validate({ params: idParam, body: c.createLogSchema }), c.createLog);

export default r;

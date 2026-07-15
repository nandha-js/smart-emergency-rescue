import { Router } from 'express';
import { createAlert } from '../services/alertService.js';

const router = Router();

// POST / — Create a new SOS alert
router.post('/', async (req, res, next) => {
  try {
    const { userId, latitude, longitude, transcript, triggerMethod } = req.body;

    if (!userId || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'userId, latitude, and longitude are required',
      });
    }

    const io = req.app.get('io');

    const alert = await createAlert(
      { userId, latitude, longitude, transcript, triggerMethod },
      io
    );

    return res.status(201).json({ success: true, alert });
  } catch (error) {
    next(error);
  }
});

export default router;

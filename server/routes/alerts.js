import { Router } from 'express';
import Alert from '../models/Alert.js';
import { updateAlertStatus } from '../services/alertService.js';

const router = Router();

// GET / — List all alerts, optionally filter by status
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const alerts = await Alert.find(filter)
      .populate('victimId')
      .sort({ createdAt: -1 });

    res.json({ success: true, alerts });
  } catch (error) {
    next(error);
  }
});

// GET /:id — Get single alert by ID
router.get('/:id', async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id).populate('victimId');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
});

// PATCH /:id — Update alert status
router.patch('/:id', async (req, res, next) => {
  try {
    const { status, respondedBy } = req.body;

    const alert = await updateAlertStatus(req.params.id, status, respondedBy);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('alert-updated', alert);
    }

    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
});

export default router;

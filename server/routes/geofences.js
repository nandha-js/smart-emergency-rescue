import { Router } from 'express';
import Geofence from '../models/Geofence.js';

const router = Router();

// GET / — List all geofences
router.get('/', async (req, res, next) => {
  try {
    const geofences = await Geofence.find().sort({ createdAt: -1 });
    res.json({ success: true, geofences });
  } catch (error) {
    next(error);
  }
});

// POST / — Create a new geofence danger zone
router.post('/', async (req, res, next) => {
  try {
    const { name, latitude, longitude, radius } = req.body;

    if (!name || latitude == null || longitude == null || !radius) {
      return res.status(400).json({ success: false, message: 'name, latitude, longitude, and radius are required' });
    }

    const geofence = await Geofence.create({
      name,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude], // [lng, lat]
      },
      radius,
    });

    // Broadcast new geofence danger zone to all clients immediately over websockets
    const io = req.app.get('io');
    if (io) {
      io.emit('new-geofence', geofence);
    }

    res.status(201).json({ success: true, geofence });
  } catch (error) {
    next(error);
  }
});

// DELETE /:id — Remove a geofence danger zone
router.delete('/:id', async (req, res, next) => {
  try {
    const geofence = await Geofence.findByIdAndDelete(req.params.id);
    if (!geofence) {
      return res.status(404).json({ success: false, message: 'Geofence not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('geofence-removed', req.params.id);
    }

    res.json({ success: true, message: 'Geofence removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

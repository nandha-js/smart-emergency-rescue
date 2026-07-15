import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

// GET / — List all users sorted by name
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().sort({ name: 1 });
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

// POST / — Create a new user
router.post('/', async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// GET /:id — Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

export default router;

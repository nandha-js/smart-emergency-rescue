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

// POST / — Create a new user (Insert User)
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

// PATCH /:id — Update user details (Edit User)
router.patch('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// DELETE /:id — Delete a single user by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE / — Delete/Clear all users from database
router.delete('/', async (req, res, next) => {
  try {
    await User.deleteMany({});
    res.json({ success: true, message: 'All users cleared successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

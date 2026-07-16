import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import setupSocket from './socket/socketHandler.js';
import sosRoutes from './routes/sos.js';
import userRoutes from './routes/users.js';
import alertRoutes from './routes/alerts.js';
import triageRoutes from './routes/triage.js';
import geofenceRoutes from './routes/geofences.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/sos', sosRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/geofences', geofenceRoutes);

// Error handler
app.use(errorHandler);

// Socket setup
setupSocket(io);

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

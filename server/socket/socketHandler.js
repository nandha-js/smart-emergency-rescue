import { updateAlertStatus } from '../services/alertService.js';

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('respond-to-alert', async ({ alertId, respondedBy }) => {
      try {
        const alert = await updateAlertStatus(alertId, 'responding', respondedBy);
        io.emit('alert-updated', alert);
      } catch (error) {
        console.error('❌ Error responding to alert:', error.message);
      }
    });

    socket.on('resolve-alert', async ({ alertId }) => {
      try {
        const alert = await updateAlertStatus(alertId, 'resolved');
        io.emit('alert-updated', alert);
      } catch (error) {
        console.error('❌ Error resolving alert:', error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

export default setupSocket;

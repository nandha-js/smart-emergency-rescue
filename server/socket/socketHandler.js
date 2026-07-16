import { updateAlertStatus } from '../services/alertService.js';
import Alert from '../models/Alert.js';

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

    socket.on('responder-gps-update', async ({ alertId, latitude, longitude }) => {
      try {
        const alert = await Alert.findByIdAndUpdate(
          alertId,
          {
            $set: {
              'responderLocation.coordinates': [longitude, latitude]
            }
          },
          { new: true }
        ).populate('victimId');

        io.emit('responder-gps-broadcast', { alertId, latitude, longitude });
        io.emit('alert-updated', alert);
      } catch (error) {
        console.error('❌ Error updating responder location:', error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

export default setupSocket;

import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { analyzeDistress } from './geminiService.js';

const createAlert = async ({ userId, latitude, longitude, transcript, triggerMethod }, io) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const aiAnalysis = await analyzeDistress(transcript);

  const alert = await Alert.create({
    victimId: userId,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    transcript: transcript || '',
    triggerMethod: triggerMethod || 'button',
    aiAnalysis,
    intent: aiAnalysis.intent,
    severity: aiAnalysis.severity,
  });

  const populatedAlert = await Alert.findById(alert._id).populate('victimId');

  if (io) {
    io.emit('new-emergency', populatedAlert);
  }

  return populatedAlert;
};

const updateAlertStatus = async (alertId, status, respondedBy) => {
  const updateFields = { status };

  if (status === 'responding') {
    updateFields.responderNote = respondedBy || '';
  }

  const alert = await Alert.findByIdAndUpdate(alertId, updateFields, {
    new: true,
  }).populate('victimId');

  return alert;
};

export { createAlert, updateAlertStatus };

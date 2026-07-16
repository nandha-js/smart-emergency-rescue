import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { analyzeDistress } from './geminiService.js';
import { sendSOSAlertSMS } from './twilioService.js';

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

  // Trigger Mock Twilio SMS Broadcast to emergency contact
  await sendSOSAlertSMS(user, alert);

  // Broadcast to Command Dashboard
  if (io) {
    io.emit('new-emergency', populatedAlert);
  }

  // Smart Bystander Routing
  // If incident is classified as medical_emergency, broadcast alert to users within 100 meters
  if (aiAnalysis.intent === 'medical_emergency' && io) {
    try {
      const nearbyBystanders = await User.find({
        _id: { $ne: userId },
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [longitude, latitude] },
            $maxDistance: 100, // 100 meters radius
          },
        },
      });

      if (nearbyBystanders.length > 0) {
        console.log(`📡 [SMART ROUTING] Identified ${nearbyBystanders.length} bystanders nearby. Dispatching proximity notifications...`);
        nearbyBystanders.forEach((bystander) => {
          // Emit bystander push notification alert targeted at that user's ID namespace channel
          io.emit(`bystander-alert-${bystander._id}`, {
            alertId: alert._id,
            victimName: user.name,
            bloodType: user.bloodType,
            conditions: user.conditions,
            latitude,
            longitude,
          });
        });
      }
    } catch (err) {
      console.error('❌ Proximity query failed:', err.message);
    }
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

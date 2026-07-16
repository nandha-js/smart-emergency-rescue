import { Router } from 'express';
import Alert from '../models/Alert.js';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

router.post('/:id/triage', async (req, res, next) => {
  try {
    const { responseText } = req.body;
    const alertId = req.params.id;

    if (!responseText) {
      return res.status(400).json({ success: false, message: 'responseText is required' });
    }

    const alert = await Alert.findById(alertId).populate('victimId');
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    let paramedicResponseText = '';

    // Check if we need local mock mode
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
      // Local Mock Conversations
      const convoLength = alert.triageConversation?.length || 0;
      const text = responseText.toLowerCase();

      if (convoLength === 0) {
        paramedicResponseText = `Aria here, first responder unit. I see you registered an emergency alert. Are you in a safe environment right now?`;
      } else if (convoLength <= 2) {
        paramedicResponseText = `I understand. Please tell me where you feel the main pain or if there is active bleeding?`;
      } else if (text.includes('bleeding') || text.includes('blood') || text.includes('cut')) {
        paramedicResponseText = `Understood. Apply firm, continuous pressure on the wound with a clean cloth. Focus on slow, deep breaths.`;
      } else if (alert.victimId?.conditions?.includes('Asthma')) {
        paramedicResponseText = `I note your history of Asthma. Try to remain upright, take slow breaths, and use your inhaler if accessible.`;
      } else {
        paramedicResponseText = `Help is on the way. Remain calm and stay on this page. Rescuers are tracking your coordinates.`;
      }
    } else {
      // Live Gemini AI Triage
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Build conversational history context
        const formattedHistory = alert.triageConversation.map(c => 
          `${c.role === 'paramedic' ? 'Aria (Paramedic)' : 'Victim'}: ${c.text}`
        ).join('\n');

        const contextPrompt = `
          Victim Profile:
          - Name: ${alert.victimId?.name}
          - Blood Type: ${alert.victimId?.bloodType}
          - Pre-existing Conditions: ${alert.victimId?.conditions?.join(', ') || 'None'}
          - Allergies: ${alert.victimId?.allergies?.join(', ') || 'None'}
          
          Incident Details:
          - Original Transcript: "${alert.transcript}"
          - Severity: ${alert.severity}

          Conversation History:
          ${formattedHistory || '(No previous conversation)'}
          
          Latest Victim Response: "${responseText}"

          Task: Generate the next response from 'Aria', the virtual paramedic first-responder avatar.
          Rules:
          1. Keep it under 35 words.
          2. Be warm, calm, reassuring, and highly professional.
          3. Ask one critical question at a time or offer simple first-aid directions based on their profile.
          4. Format as structured JSON containing a single string property 'responseText'.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: contextPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                responseText: { type: Type.STRING }
              },
              required: ['responseText']
            }
          }
        });

        const parsed = JSON.parse(response.text);
        paramedicResponseText = parsed.responseText;
      } catch (geminiError) {
        console.error('❌ Gemini Triage generation failed:', geminiError.message);
        paramedicResponseText = `Help is en route to your location. Please stay calm and hold pressure on any wounds.`;
      }
    }

    // Save logs to database
    alert.triageConversation.push({ role: 'victim', text: responseText });
    alert.triageConversation.push({ role: 'paramedic', text: paramedicResponseText });
    await alert.save();

    // Broadcast to dispatcher dashboard
    const io = req.app.get('io');
    if (io) {
      const updatedAlert = await Alert.findById(alert._id).populate('victimId');
      io.emit('alert-updated', updatedAlert);
    }

    res.json({
      success: true,
      responseText: paramedicResponseText,
      conversation: alert.triageConversation
    });
  } catch (error) {
    next(error);
  }
});

export default router;

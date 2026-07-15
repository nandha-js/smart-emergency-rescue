import { GoogleGenAI, Type } from '@google/genai';

const analyzeDistress = async (transcript) => {
  if (!transcript || transcript.trim() === '') {
    return {
      intent: 'emergency_sos',
      isDistressed: true,
      severity: 'high',
      summary: 'Manual SOS trigger - no voice data',
    };
  }

  // Check if we need local mock mode (for prototype/development without keys)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.log('🤖 [AI Service] Gemini API Key is missing or using placeholder. Activating local mock engine...');
    
    const text = transcript.toLowerCase();
    let intent = 'emergency_sos';
    let severity = 'high';
    let summary = 'Distress keywords detected in voice signal. Emergency status confirmed.';

    if (text.includes('medical') || text.includes('breathing') || text.includes('heart') || text.includes('pain') || text.includes('seizure') || text.includes('epilepsy') || text.includes('asthma')) {
      intent = 'medical_emergency';
      severity = 'high';
      summary = 'Voice signal matches medical distress signatures. Pre-existing condition alert potential.';
    } else if (text.includes('fire') || text.includes('smoke') || text.includes('burn') || text.includes('explode')) {
      intent = 'fire_emergency';
      severity = 'critical';
      summary = 'Fire or structural combustion indicators detected. High risk of inhalation injury.';
    } else if (text.includes('accident') || text.includes('crash') || text.includes('car') || text.includes('road')) {
      intent = 'traffic_accident';
      severity = 'high';
      summary = 'Collision or vehicle impact event detected. Emergency rescue dispatch required.';
    } else if (text.includes('attack') || text.includes('assault') || text.includes('fight') || text.includes('weapon') || text.includes('kill')) {
      intent = 'assault_emergency';
      severity = 'critical';
      summary = 'Active physical violence or assault threat detected. Immediate protective response requested.';
    } else if (text.includes('save me') || text.includes('help') || text.includes('please help') || text.includes('sos')) {
      intent = 'emergency_sos';
      severity = 'high';
      summary = 'Explicit distress cry for help detected. Activating rapid incident protocol.';
    }

    return {
      intent,
      isDistressed: true,
      severity,
      summary
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: transcript,
      config: {
        systemInstruction:
          'You are an emergency distress analysis AI. Analyze the following transcript from an emergency call or voice trigger. ' +
          'Determine the intent (e.g., medical_emergency, fire, accident, assault, natural_disaster, emergency_sos), ' +
          'whether the person sounds distressed, the severity level (low, medium, high, critical), ' +
          'and provide a brief summary of the situation. Be concise and accurate.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING },
            isDistressed: { type: Type.BOOLEAN },
            severity: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ['intent', 'isDistressed', 'severity', 'summary'],
        },
      },
    });

    const parsed = JSON.parse(response.text);
    return parsed;
  } catch (error) {
    console.error('❌ Gemini analysis failed:', error.message);
    return {
      intent: 'emergency_sos',
      isDistressed: true,
      severity: 'high',
      summary: `AI analysis failed. Raw transcript: "${transcript}"`,
    };
  }
};

export { analyzeDistress };

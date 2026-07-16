export const sendSOSAlertSMS = async (user, alert) => {
  try {
    const contact = user.emergencyContact;
    if (!contact || !contact.phone) {
      console.log(`📱 [TWILIO SMS MOCK] Aborted: No emergency contact phone registered for ${user.name}`);
      return;
    }

    const [longitude, latitude] = alert.location.coordinates;
    const googleMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

    const messageBody = `🚨 SERS URGENT: ${user.name} has triggered an SOS incident!
- Distress ID: ${user.distressId || 'N/A'}
- Blood Type: ${user.bloodType || 'Unknown'}
- Conditions: ${user.conditions?.join(', ') || 'None'}
- Coordinates: [${latitude.toFixed(5)}, ${longitude.toFixed(5)}]
- View Live Route Map: ${googleMapsUrl}
Responders have been notified. Stay calm.`;

    console.log(`
============================================================
📱 [MOCK TWILIO SMS TRANSMISSION]
------------------------------------------------------------
To Emergency Contact: ${contact.name} (${contact.phone})
Relationship: ${contact.relationship}
------------------------------------------------------------
Message:
${messageBody}
============================================================
    `);

    return { success: true, mockSent: true };
  } catch (error) {
    console.error('❌ Error sending mock Twilio SMS:', error.message);
  }
};

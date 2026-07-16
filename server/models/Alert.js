import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  victimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'responding', 'resolved'],
    default: 'active',
  },
  intent: { type: String, default: 'emergency' },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  responderNote: { type: String, default: '' },
  transcript: { type: String, default: '' },
  triggerMethod: {
    type: String,
    enum: ['button', 'voice', 'auto'],
    default: 'button',
  },
  aiAnalysis: {
    intent: { type: String, default: 'emergency' },
    isDistressed: { type: Boolean, default: true },
    severity: { type: String, default: 'high' },
    summary: { type: String, default: '' },
  },
  responderLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [78.9629, 20.5937]
    },
  },
  triageConversation: [
    {
      role: { type: String, enum: ['paramedic', 'victim'] },
      text: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  audioClips: [
    {
      data: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

alertSchema.index({ location: '2dsphere' });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;

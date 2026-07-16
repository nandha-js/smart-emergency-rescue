import mongoose from 'mongoose';

const geofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  radius: {
    type: Number, // in meters
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

geofenceSchema.index({ location: '2dsphere' });

const Geofence = mongoose.model('Geofence', geofenceSchema);

export default Geofence;

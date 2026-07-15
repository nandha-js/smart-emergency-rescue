import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  age: { type: Number },
  bloodType: { type: String },
  conditions: [String],
  allergies: [String],
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }
  },
  distressId: { type: String, required: true, unique: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [78.9629, 20.5937] } // [lng, lat]
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

export default User;

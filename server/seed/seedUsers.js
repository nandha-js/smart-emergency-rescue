import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Alert from '../models/Alert.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const demoUsers = [
  {
    name: 'Priya',
    phone: '+91-9876543210',
    email: 'priya@example.com',
    age: 28,
    bloodType: 'O+',
    allergies: ['Peanuts'],
    conditions: ['Asthma'],
    medications: ['Salbutamol inhaler'],
    emergencyContact: { name: 'Ravi ', phone: '+91-9876543211', relationship: 'Father' },
    distressId: 'V-2292',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716] // Bangalore
    }
  },
  {
    name: 'Rahul',
    phone: '+91-9123456789',
    email: 'rahul@example.com',
    age: 45,
    bloodType: 'B+',
    allergies: [],
    conditions: ['Diabetes Type 2'],
    medications: ['Metformin 500mg'],
    emergencyContact: { name: 'Sunita ', phone: '+91-9123456790', relationship: 'Wife' },
    distressId: 'V-2293',
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.0760] // Mumbai
    }
  },
  {
    name: 'Kumar',
    phone: '+91-9988776655',
    email: 'kumar@example.com',
    age: 32,
    bloodType: 'A-',
    allergies: ['Penicillin'],
    conditions: [],
    medications: [],
    emergencyContact: { name: 'Srinivas ', phone: '+91-9988776656', relationship: 'Father' },
    distressId: 'V-2294',
    location: {
      type: 'Point',
      coordinates: [78.4867, 17.3850] // Hyderabad
    }
  },
  {
    name: 'Das-Mini😁',
    phone: '+91-9555444333',
    email: 'das-mini@example.com',
    age: 58,
    bloodType: 'O Negative', // Fulfill PDF page 11 (O Negative, pre-existing conditions: Type 1 Diabetes, drug allergies: Penicillin, emergency contact: Meera Singh - +91 98xxxxxx21)
    allergies: ['Penicillin'],
    conditions: ['Type 1 Diabetes'],
    medications: ['Insulin Glargine'],
    emergencyContact: { name: 'Meera', phone: '+91-9555444334', relationship: 'Daughter' },
    distressId: 'V-2291',
    location: {
      type: 'Point',
      coordinates: [77.2090, 28.6139] // Delhi
    }
  },
  {
    name: 'Meera',
    phone: '+91-9222111000',
    email: 'meera@example.com',
    age: 24,
    bloodType: 'A+',
    allergies: ['Shellfish'],
    conditions: ['Epilepsy'],
    medications: ['Levetiracetam 500mg'],
    emergencyContact: { name: 'Jayesh ', phone: '+91-9222111001', relationship: 'Father' },
    distressId: 'V-2295',
    location: {
      type: 'Point',
      coordinates: [72.5714, 23.0225] // Ahmedabad
    }
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    await Alert.deleteMany({});
    console.log('🗑️  Cleared existing alerts');

    const users = await User.insertMany(demoUsers);
    console.log(`🌱 Seeded ${users.length} demo users:`);
    users.forEach((u) => console.log(`   - ${u.name} (${u.bloodType}) [Distress ID: ${u.distressId}]`));

    await mongoose.disconnect();
    console.log('✅ Seeding complete, disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDB();

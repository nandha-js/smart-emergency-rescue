# Smart Emergency Rescue System (SERS)

An advanced, real-time emergency response platform utilizing a decoupled **MERN Stack** (MongoDB, Express, React, Node.js) integrated with **Edge AI** for rapid distress verification and victim routing.

---

## 🌟 Key Capabilities & PDF Compliance

This prototype is built in strict compliance with the **SERS Specifications & Database Design**:

1.  **Tactile SOS Button**: Concentric pulsating panic button requiring a deliberate **3-second hold** to prevent false triggers, providing tactile device vibration feedback while holding (Slide 5).
2.  **Hands-Free Voice SOS**: Utilizes the **HTML5 Web Speech API** to continuously monitor microphone inputs for specific distress phrases (*"help"*, *"emergency"*, *"save me"*, etc.) and auto-trigger signals (Slide 6).
3.  **HTML5 Geolocation Tracking**: Captures precise latitude, longitude, and confidence accuracy metrics at the moment of trigger and continues to watch coordinates via `watchPosition` (Slide 7).
4.  **Gemini AI Intent Classification**: Translates transcript feeds using **Google's Gemini model** to parse emergency intent (e.g., `medical_emergency`, `assault_emergency`, `fire_emergency`), calculate severity (e.g., `critical`, `high`), and formulate action summaries (Slide 8).
5.  **Local AI Fallback Engine**: If no Gemini API key is configured, the system automatically defaults to a built-in rule-based keyword classifier to guarantee out-of-the-box prototype execution (Slide 9).
6.  **Interactive Command Map**: Live incident feed updates the rescue map in real time via **Socket.io** WebSockets. Custom status markers show active (crimson pulsing), responding (amber), and resolved (emerald) locations. Clicking a marker centers the camera and fly-pans to the location (Slide 10).
7.  **Victim Medical Card**: Instantly matches the distress ID to MongoDB databases, appending critical patient records (blood type, pre-existing conditions, drug allergies, emergency contacts) to the outbound dispatcher package (Slide 11).

---

## 🛠️ Technology Stack (Slide 13)

*   **Frontend**: React 19, Vite, Leaflet.js, Context API, Vanilla CSS (Glassmorphism design tokens)
*   **Backend**: Node.js, Express, Socket.io, Google Gen AI SDK, Helmet (Security), CORS
*   **Database**: MongoDB Server (Mongoose ODM, GeoJSON 2dsphere index)
*   **APIs**: Web Speech API, HTML5 Geolocation API, Gemini Flash model

---

## 📂 Project Structure (Slide 14 & 15)

```
smart-emergency-rescue/
├── client/                          # React + Vite Frontend
│   ├── public/
│   │   └── favicon.svg              # Brand red shield logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Navbar, Spinner, Toasts
│   │   │   ├── VictimSOS/           # SOS Button, Voice Mic, GeoTracker
│   │   │   └── Dashboard/           # Leaflet Map, Alert Feed, Patient Cards
│   │   ├── context/
│   │   │   └── SocketContext.jsx    # Socket.io connection state
│   │   ├── hooks/
│   │   │   ├── useGeolocation.js    # GPS Satellite watcher
│   │   │   ├── useVoiceRecognition.js# Web Speech listener
│   │   │   └── useSocket.js         # Socket action dispatch helpers
│   │   ├── pages/
│   │   │   ├── VictimPage.jsx       # Mobile client screen
│   │   │   └── DashboardPage.jsx    # Mission control command center
│   │   ├── services/
│   │   │   └── api.js               # Axios instance config
│   │   ├── styles/
│   │   │   └── index.css            # Dark theme, glassmorphism tokens
│   │   ├── App.jsx                  # React router setup
│   │   └── main.jsx                 # Client entry point
│   ├── index.html
│   └── vite.config.js
│
├── server/                          # Express + Socket.io Server
│   ├── config/
│   │   └── db.js                    # MongoDB mongoose handler
│   ├── middleware/
│   │   └── errorHandler.js          # App error responses
│   ├── models/
│   │   ├── User.js                  # Patient profile schema
│   │   └── Alert.js                 # Incident logging schema
│   ├── routes/
│   │   ├── sos.js                   # POST /api/sos endpoint
│   │   ├── users.js                 # Victim details route
│   │   └── alerts.js                # PATCH/GET updates route
│   ├── seed/
│   │   └── seedUsers.js             # Demo database seeder
│   ├── services/
│   │   ├── alertService.js          # Database state transitions
│   │   └── geminiService.js         # AI classification + local fallback
│   ├── socket/
│   │   └── socketHandler.js         # WebSocket dispatch events
│   ├── .env.example
│   └── server.js                    # Server entry point
```

---

## 🗄️ Database Design (Slide 16)

The platform is driven by two Mongoose collections:

### 1. `User.js` — Patient Profile
```javascript
{
  name: String,
  bloodType: String,
  conditions: [String],
  allergies: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  distressId: { type: String, unique: true },
  location: GeoJSON Point,
  createdAt: Date
}
```

### 2. `Alert.js` — Incident Log
```javascript
{
  victimId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: String,       // 'active' | 'responding' | 'resolved'
  intent: String,       // AI classified
  severity: String,     // 'critical' | 'high' | 'medium' | 'low'
  location: GeoJSON Point (with 2dsphere index),
  responderNote: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## ⚡ Setup & Launch Instructions (Slide 18)

### Prerequisites
1. **Node.js**: Verify installation using `node --version` (v18+ recommended).
2. **MongoDB**: Ensure local database server is running.

### 1. Database Seeding
Connect to MongoDB and populate the 5 demo victim profiles (including Vikram Singh):
```bash
# Navigate to project root
cd "C:\Users\nandh\.gemini\antigravity\scratch\smart-emergency-rescue"

# Start the database service
Start-Service MongoDB

# Seed the database
npm run seed
```

### 2. Configure Environment Variables (Optional)
Open `server/.env` and replace `YOUR_GEMINI_API_KEY` with your credentials from Google AI Studio. 
*Note: If left empty, the local rule-based fallback AI will handle classification automatically.*

### 3. Launch Development Servers
Launch both the backend API and frontend client concurrently:
```bash
npm run dev
```

*   **Victim Console**: [http://localhost:5173](http://localhost:5173)
*   **Rescuer Dashboard**: [http://localhost:5173/dashboard](http://localhost:5173/dashboard)

---

## 🧪 Interactive Validation Workflow (Slide 19)

1. **Open both consoles**: Victim Console and Rescuer Dashboard side-by-side.
2. **Select a profile**: e.g., Vikram Singh (Distress ID `V-2291`).
3. **Trigger the SOS**: Hold the SOS button or speak a distress phrase like *"accident"*.
4. **Watch it land live**: Stats counter increments, map fly-pans directly to the pulsing marker.
5. **Dispatch a responder**: Enter a responder unit (e.g., *"Ambulance Unit 5"*). The marker instantly turns amber (Responding).
6. **Resolve the alert**: Click **Stabilized**. The marker turns emerald (Resolved).

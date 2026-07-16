import { useState, useEffect, useRef } from 'react'
import useGeolocation from '../hooks/useGeolocation'
import useVoiceRecognition from '../hooks/useVoiceRecognition'
import useAcousticClassifier from '../hooks/useAcousticClassifier'
import useSocket from '../hooks/useSocket'
import { getUsers, triggerSOS, getGeofences, postBlackboxAudio } from '../services/api'
import SOSButton from '../components/VictimSOS/SOSButton'
import VoiceRecognition from '../components/VictimSOS/VoiceRecognition'
import LocationTracker from '../components/VictimSOS/LocationTracker'
import ParamedicAvatar from '../components/VictimSOS/ParamedicAvatar'
import VictimTrackerMap from '../components/VictimSOS/VictimTrackerMap'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Toast from '../components/common/Toast'

export default function VictimPage() {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [sosSent, setSosSent] = useState(false)
  const [activeAlert, setActiveAlert] = useState(null)
  const [apiError, setApiError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  const { latitude, longitude, accuracy, error: geoError, loading: geoLoading, retry } = useGeolocation()
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    detectedKeyword,
    resetTranscript,
  } = useVoiceRecognition()

  const [editableTranscript, setEditableTranscript] = useState('')
  const [stealthMode, setStealthMode] = useState(false)
  const [geofences, setGeofences] = useState([])
  const [insideGeofence, setInsideGeofence] = useState(null)
  const [bystanderAlert, setBystanderAlert] = useState(null)

  const mediaRecorderRef = useRef(null)
  const blackboxIntervalRef = useRef(null)
  const { socket } = useSocket()

  // Sync mic transcripts to editable state
  useEffect(() => {
    if (transcript) {
      setEditableTranscript(transcript)
    }
  }, [transcript])

  // Silent WebRTC Blackbox Audio recorder
  const startBlackboxRecording = async (alertId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder

      let chunks = []
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = async () => {
        if (chunks.length === 0) return
        const blob = new Blob(chunks, { type: 'audio/webm' })
        chunks = [] // Reset

        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = async () => {
          const base64Data = reader.result.split(',')[1]
          try {
            await postBlackboxAudio(alertId, base64Data)
          } catch (err) {
            console.error('Failed to post blackbox chunk:', err)
          }
        }

        // Restart recording segment
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
          mediaRecorderRef.current.start()
        }
      }

      recorder.start()

      // Stop and restart every 5 seconds to send chunks
      blackboxIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 5000)

    } catch (err) {
      console.error('Failed to start silent WebRTC blackbox:', err)
    }
  }

  const stopBlackboxRecording = () => {
    if (blackboxIntervalRef.current) {
      clearInterval(blackboxIntervalRef.current)
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
  }

  // Geofence database fetcher
  useEffect(() => {
    const fetchAndCheckGeofences = async () => {
      try {
        const response = await getGeofences()
        if (response.data.success) {
          setGeofences(response.data.geofences)
        }
      } catch (err) {
        console.error('Failed to fetch danger zone geofences:', err)
      }
    }

    fetchAndCheckGeofences()
    const intv = setInterval(fetchAndCheckGeofences, 10000)
    return () => clearInterval(intv)
  }, [])

  // Geofence proximity checking
  useEffect(() => {
    if (latitude == null || longitude == null || geofences.length === 0) return

    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3 // Earth radius in meters
      const phi1 = lat1 * Math.PI / 180
      const phi2 = lat2 * Math.PI / 180
      const deltaPhi = (lat2 - lat1) * Math.PI / 180
      const deltaLambda = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    let activeDangerZone = null
    for (const gf of geofences) {
      const [gLng, gLat] = gf.location.coordinates
      const dist = getDistance(latitude, longitude, gLat, gLng)
      if (dist <= gf.radius) {
        activeDangerZone = gf
        break
      }
    }
    setInsideGeofence(activeDangerZone)
  }, [latitude, longitude, geofences])

  // Smart Bystander socket listeners
  useEffect(() => {
    if (!socket || !selectedUserId) return

    const channel = `bystander-alert-${selectedUserId}`
    
    const handleAlert = (data) => {
      setBystanderAlert(data)
      setToastMessage(`🚨 EMERGENCY BROADCAST: Proximity medical incident!`)
      setToastType('error')
    }

    socket.on(channel, handleAlert)
    return () => {
      socket.off(channel, handleAlert)
    }
  }, [socket, selectedUserId])

  // Acoustic Edge AI Auto-detection
  const {
    isClassifying,
    startClassification,
    stopClassification,
    detectedPattern,
  } = useAcousticClassifier({
    onEmergencyDetected: (reason) => {
      setToastMessage(`🚨 Edge AI Alert: ${reason}`)
      setToastType('error')
      handleTriggerSOS('auto', reason)
    }
  })

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await getUsers()
        if (response.data.success) {
          setUsers(response.data.users)
          if (response.data.users.length > 0) {
            setSelectedUserId(response.data.users[0]._id)
          }
        }
      } catch (err) {
        console.error('Failed to load victims database:', err)
        setApiError('Rescuer DB Offline - Default Mode Active')
      } finally {
        setLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [])

  // Auto-trigger when voice keyword is detected
  useEffect(() => {
    if (detectedKeyword && selectedUserId && latitude != null && longitude != null && !sosSent) {
      handleTriggerSOS('voice', transcript)
    }
  }, [detectedKeyword])

  // Alert on location disabled / missing GPS permission
  useEffect(() => {
    if (geoError) {
      setToastMessage('⚠️ Location Services Disabled: Rescuers cannot locate you without GPS. Please check browser permissions.')
      setToastType('error')
    }
  }, [geoError])

  const handleTriggerSOS = async (method = 'button', voiceTranscript = '') => {
    if (!selectedUserId) {
      setToastMessage('Please select a victim profile first.')
      setToastType('warning')
      return
    }
    if (latitude == null || longitude == null) {
      setToastMessage('GPS Coordinates not acquired yet.')
      setToastType('warning')
      return
    }

    try {
      setApiError('')
      const payload = {
        userId: selectedUserId,
        latitude,
        longitude,
        transcript: editableTranscript || (method === 'voice' ? voiceTranscript : 'Manual emergency activation via SOS hold button.'),
        triggerMethod: method,
      }

      const response = await triggerSOS(payload)
      if (response.data.success) {
        setActiveAlert(response.data.alert)
        setSosSent(true)
        setToastMessage('Emergency transmission confirmed! Rescuers notified.')
        setToastType('success')
        stopListening()
        startBlackboxRecording(response.data.alert._id)
      } else {
        setApiError('SOS Server response error. Signal retry.')
      }
    } catch (err) {
      console.error('Emergency signal routing failed:', err)
      setApiError('Satellite routing error. Retrying SOS link.')
    }
  }

  const handleReset = () => {
    setSosSent(false)
    setActiveAlert(null)
    setApiError('')
    resetTranscript()
    setEditableTranscript('')
    stopClassification()
    stopBlackboxRecording()
    setStealthMode(false)
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const selectedUser = users.find((u) => u._id === selectedUserId)

  if (loadingUsers) {
    return <LoadingSpinner message="Securing medical database link..." />
  }

  if (stealthMode) {
    return (
      <div
        onDoubleClick={() => setStealthMode(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          zIndex: 99999,
          cursor: 'none',
        }}
        title="Double tap to exit stealth mode"
      />
    )
  }

  return (
    <div className="sos-container">
      {/* Geofence Danger Zone Alert Overlay */}
      {insideGeofence && (
        <div
          style={{
            position: 'fixed',
            top: '75px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            padding: '1.25rem',
            borderRadius: '8px',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
            zIndex: 9999,
            animation: 'shake 0.5s ease infinite alternate',
            border: '2px solid #fff',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️</span> DANGER ZONE DETECTED
          </div>
          <p style={{ fontSize: '0.78rem', marginTop: '0.25rem', lineHeight: '1.4' }}>
            You have entered the geofenced danger zone: <strong>"{insideGeofence.name}"</strong>. Please vacate this area immediately.
          </p>
        </div>
      )}

      {/* Proximity Bystander Alert Popup */}
      {bystanderAlert && (
        <div
          className="glass-card"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            borderLeft: '4px solid var(--color-info)',
            background: 'rgba(13, 19, 33, 0.95)',
            padding: '1.25rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 9998,
            animation: 'slide-up 0.3s ease',
          }}
        >
          <div style={{ fontWeight: 800, color: 'var(--color-info)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🚨</span> NEARBY MEDICAL INCIDENT
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem', lineHeight: '1.45' }}>
            <strong>{bystanderAlert.victimName}</strong> requires first-aid support within 100 meters of your position!
            <br />
            Blood Type: <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{bystanderAlert.bloodType || 'Unknown'}</span>
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <a
              href={`https://maps.google.com/?q=${bystanderAlert.latitude},${bystanderAlert.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-success"
              style={{ flex: 1, textDecoration: 'none', textAlign: 'center', fontSize: '0.75rem', padding: '0.5rem' }}
              onClick={() => setBystanderAlert(null)}
            >
              Respond & Map
            </a>
            <button
              onClick={() => setBystanderAlert(null)}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.5rem' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%)',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {sosSent ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
              🚨 Incident Dispatch Active
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', textAlign: 'center', maxWidth: '350px' }}>
              First responders are tracking your location. Stay on this screen.
            </p>

            {/* Paramedic Avatar Card */}
            <ParamedicAvatar alertId={activeAlert?._id} onResolve={handleReset} />

            {/* Incoming Ambulance Map */}
            <VictimTrackerMap alert={activeAlert} />

            {/* Stealth & Cancel Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '440px', marginTop: '1.5rem' }}>
              <button
                onClick={() => setStealthMode(true)}
                className="btn btn-danger"
                style={{ flex: 1, padding: '0.85rem', fontSize: '0.85rem' }}
              >
                👁️ Stealth Mode (Black Screen)
              </button>
              <button
                onClick={handleReset}
                className="btn btn-outline"
                style={{ flex: 1, padding: '0.85rem', fontSize: '0.85rem' }}
              >
                Cancel SOS
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* User select area */}
            <div className="glass-card" style={{ width: '100%', maxWidth: '400px', marginBottom: '2rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.5rem',
                }}
              >
                ACTIVE VICTIM PROFILE
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: 'var(--color-text)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                {users.map((user) => (
                  <option key={user._id} value={user._id} style={{ background: 'var(--color-surface)' }}>
                    {user.name} ({user.bloodType || 'Unknown Blood'})
                  </option>
                ))}
              </select>
              {selectedUser && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Allergies: {selectedUser.allergies?.join(', ') || 'None'} | Conditions:{' '}
                  {selectedUser.conditions?.join(', ') || 'None'}
                </div>
              )}
            </div>

            {/* GPS Permission Warning Banner */}
            {geoError && (
              <div
                className="glass-card"
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  borderLeft: '4px solid var(--color-danger)',
                  background: 'rgba(220, 38, 38, 0.1)',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  borderRadius: '0 8px 8px 0',
                  animation: 'shake 0.5s ease',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span>⚠️</span> GPS SIGNAL REQUIRED
                </div>
                <p style={{ marginTop: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.78rem', lineHeight: '1.4' }}>
                  Location permissions are denied or disabled. Emergency services require GPS signals to track coordinates in real-time. Please click the address bar icon to allow location access.
                </p>
              </div>
            )}

            {/* SOS Panic Button */}
            <SOSButton
              onTrigger={() => handleTriggerSOS('button')}
              disabled={sosSent || geoLoading}
              triggered={sosSent}
            />

            {/* Voice Recognition Section */}
            <VoiceRecognition
              isListening={isListening}
              onToggle={handleVoiceToggle}
              transcript={editableTranscript}
              interimTranscript={interimTranscript}
              detectedKeyword={detectedKeyword}
              isSupported={voiceSupported}
              onTranscriptChange={setEditableTranscript}
            />

            {/* Acoustic Edge AI Trigger Section */}
            <div className="glass-card" style={{ marginTop: '1rem', width: '100%', maxWidth: '400px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Acoustic Edge AI Trigger</span>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                    Auto-triggers SOS on screaming or collision sounds
                  </p>
                </div>
                <button
                  type="button"
                  onClick={isClassifying ? stopClassification : startClassification}
                  className={`btn ${isClassifying ? 'btn-success' : 'btn-outline'}`}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem' }}
                >
                  {isClassifying ? 'Active' : 'Muted'}
                </button>
              </div>
              {isClassifying && (
                <div style={{ fontSize: '0.72rem', color: 'var(--color-info)', marginTop: '0.5rem', fontStyle: 'italic', textAlign: 'center' }}>
                  👂 Mic active: clap or speak loudly to test acoustic levels locally
                </div>
              )}
            </div>

            {/* Geolocation Section */}
            <LocationTracker
              latitude={latitude}
              longitude={longitude}
              accuracy={accuracy}
              error={geoError}
              loading={geoLoading}
              onRetry={retry}
            />

            {/* Network/API Error display */}
            {apiError && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  color: 'var(--color-danger)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  fontWeight: 500,
                  width: '100%',
                  maxWidth: '400px',
                }}
              >
                {apiError}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating alert toast notifications */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={!!toastMessage}
        onClose={() => setToastMessage('')}
      />
    </div>
  )
}

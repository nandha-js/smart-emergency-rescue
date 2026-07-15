import { useState, useEffect } from 'react'
import useGeolocation from '../hooks/useGeolocation'
import useVoiceRecognition from '../hooks/useVoiceRecognition'
import { getUsers, triggerSOS } from '../services/api'
import SOSButton from '../components/VictimSOS/SOSButton'
import VoiceRecognition from '../components/VictimSOS/VoiceRecognition'
import LocationTracker from '../components/VictimSOS/LocationTracker'
import SOSConfirmation from '../components/VictimSOS/SOSConfirmation'
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

  const { latitude, longitude, accuracy, error: geoError, loading: geoLoading } = useGeolocation()
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
        transcript: method === 'voice' ? voiceTranscript : 'Manual emergency activation via SOS hold button.',
        triggerMethod: method,
      }

      const response = await triggerSOS(payload)
      if (response.data.success) {
        setActiveAlert(response.data.alert)
        setSosSent(true)
        setToastMessage('Emergency transmission confirmed! Rescuers notified.')
        setToastType('success')
        stopListening()
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

  return (
    <div className="sos-container">
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
          transcript={transcript}
          interimTranscript={interimTranscript}
          detectedKeyword={detectedKeyword}
          isSupported={voiceSupported}
        />

        {/* Geolocation Section */}
        <LocationTracker
          latitude={latitude}
          longitude={longitude}
          accuracy={accuracy}
          error={geoError}
          loading={geoLoading}
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
      </div>

      {/* SOS Confirmation Modal Overlay */}
      {sosSent && <SOSConfirmation alert={activeAlert} onReset={handleReset} />}

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

import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getAlerts } from '../services/api'
import useSocket from '../hooks/useSocket'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Toast from '../components/common/Toast'

export default function ResponderPage() {
  const [activeAlerts, setActiveAlerts] = useState([])
  const [currentAlert, setCurrentAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  // Telemetry variables
  const [speed, setSpeed] = useState(0)
  const [distanceRemaining, setDistanceRemaining] = useState(0)
  const [eta, setEta] = useState(0)

  const { socket, alerts, setAlerts, respondToAlert, resolveAlert } = useSocket()
  
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const responderMarkerRef = useRef(null)
  const victimMarkerRef = useRef(null)
  const simulationIntervalRef = useRef(null)

  // Fetch alerts
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await getAlerts()
        if (response.data.success) {
          const unfiltered = response.data.alerts
          setActiveAlerts(unfiltered.filter(a => a.status !== 'resolved'))

          // Keep current alert details in sync with live WebSockets triage chat!
          if (currentAlert) {
            const freshAlert = unfiltered.find(a => a._id === currentAlert._id)
            if (freshAlert) {
              setCurrentAlert(freshAlert)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load alerts for companion:', err)
        setToastMessage('Database connection lost. Active radio links on.')
        setToastType('error')
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [alerts])

  // Map Initialization
  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([20.5937, 78.9629], 5)

    L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map)

    mapRef.current = map

    setTimeout(() => {
      map.invalidateSize()
    }, 250)
  }, [loading])

  // Start route coordinate simulation (Linear interpolation from driver to victim)
  const startRouteSimulation = (alert) => {
    if (!socket || !mapRef.current) return

    setSimulating(true)
    setToastMessage('Dispatch route active. Streaming live coordinates...')
    setToastType('success')

    const [vLng, vLat] = alert.location.coordinates
    
    // Simulate responder starting slightly away
    let startLat = vLat + 0.015
    let startLng = vLng - 0.015

    // Add marker for victim
    if (victimMarkerRef.current) mapRef.current.removeLayer(victimMarkerRef.current)
    victimMarkerRef.current = L.marker([vLat, vLng], {
      icon: L.divIcon({
        className: 'emergency-marker active',
        html: '<div style="background:#ef4444; width:15px; height:15px; border-radius:50%"></div>',
        iconSize: [15, 15],
      })
    }).addTo(mapRef.current).bindPopup('Victim Location').openPopup()

    // Add marker for responder
    if (responderMarkerRef.current) mapRef.current.removeLayer(responderMarkerRef.current)
    responderMarkerRef.current = L.marker([startLat, startLng], {
      icon: L.divIcon({
        className: 'responder-marker-wrapper',
        html: '<div style="background:#f59e0b; width:15px; height:15px; border-radius:50%; border:2px solid #fff"></div>',
        iconSize: [15, 15],
      })
    }).addTo(mapRef.current).bindPopup('Ambulance Unit 5').openPopup()

    mapRef.current.fitBounds([
      [startLat, startLng],
      [vLat, vLng]
    ], { padding: [50, 50] })

    // Initialize telemetry values
    setSpeed(60)
    setDistanceRemaining(1500)
    setEta(90)

    // Simulate movement steps towards victim
    const steps = 30
    let step = 0

    simulationIntervalRef.current = setInterval(() => {
      step += 1
      const ratio = step / steps
      const currentLat = startLat + (vLat - startLat) * ratio
      const currentLng = startLng + (vLng - startLng) * ratio

      // Telemetry Simulation calculations
      const randSpeed = Math.floor(52 + Math.random() * 15)
      setSpeed(randSpeed)

      const remDistance = Math.max(0, 1500 - Math.floor(ratio * 1500))
      setDistanceRemaining(remDistance)

      const remSeconds = Math.ceil((remDistance / 1000) * (3600 / randSpeed))
      setEta(remSeconds)

      // Update marker coordinates
      responderMarkerRef.current.setLatLng([currentLat, currentLng])
      mapRef.current.setView([currentLat, currentLng])

      // Emit coordinate packet
      socket.emit('responder-gps-update', {
        alertId: alert._id,
        latitude: currentLat,
        longitude: currentLng
      })

      if (step >= steps) {
        clearInterval(simulationIntervalRef.current)
        setSimulating(false)
        setSpeed(0)
        setDistanceRemaining(0)
        setEta(0)
        setToastMessage('Arrived at victim destination!')
        setToastType('info')
      }
    }, 1500)
  }

  const handleRespond = async (alert) => {
    try {
      const response = await respondToAlert(alert._id, 'Ambulance Unit 5')
      if (response.success) {
        setCurrentAlert(response.alert)
        startRouteSimulation(response.alert)
      }
    } catch (err) {
      setToastMessage('Failed to accept dispatch.')
      setToastType('error')
    }
  }

  const handleResolve = async () => {
    if (!currentAlert) return
    try {
      const response = await resolveAlert(currentAlert._id)
      if (response.success) {
        setToastMessage('Alert resolved successfully.')
        setToastType('success')
        
        // Reset Map
        if (responderMarkerRef.current) mapRef.current.removeLayer(responderMarkerRef.current)
        if (victimMarkerRef.current) mapRef.current.removeLayer(victimMarkerRef.current)
        mapRef.current.setView([20.5937, 78.9629], 5)

        setCurrentAlert(null)
      }
    } catch (err) {
      setToastMessage('Failed to resolve alert.')
      setToastType('error')
    }
  }

  if (loading) return <LoadingSpinner message="Linking first responder satellite grids..." />

  return (
    <div className="dashboard-layout" style={{ height: 'calc(100vh - 64px)', marginTop: '64px' }}>
      
      {/* Active cases panel */}
      <div className="dashboard-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Mobile Dispatch Unit</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            Unit: Ambulance Unit 5 (Active Triage)
          </p>
        </div>

        {/* Selected Alert Details */}
        {currentAlert ? (
          <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', borderLeft: '3px solid var(--color-warning)' }}>
              <span className="badge badge-responding" style={{ marginBottom: '0.5rem' }}>RESPONDING</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{currentAlert.victimId?.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Allergies: {currentAlert.victimId?.allergies?.join(', ') || 'None'} <br />
                Conditions: {currentAlert.victimId?.conditions?.join(', ') || 'None'}
              </p>
            </div>

            {/* Simulated Telemetry HUD */}
            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                📈 Route Telemetry (Ambulance 05)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
                  <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--color-text-secondary)' }}>SPEED</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-warning)' }}>{speed} km/h</span>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
                  <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--color-text-secondary)' }}>DISTANCE</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-info)' }}>{distanceRemaining}m</span>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
                  <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--color-text-secondary)' }}>ETA</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-success)' }}>{eta}s</span>
                </div>
              </div>
            </div>

            {/* Live Triage Dialogue Feed */}
            {currentAlert.triageConversation && currentAlert.triageConversation.length > 0 && (
              <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', maxHeight: '180px', overflowY: 'auto' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  🎙️ Live Triage Feed (Aria Chat)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
                  {currentAlert.triageConversation.map((msg, idx) => (
                    <div key={idx} style={{ padding: '0.25rem', borderRadius: '4px', background: msg.role === 'paramedic' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)' }}>
                      <strong>{msg.role === 'paramedic' ? 'Aria' : 'You'}:</strong> {msg.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleResolve}
              className="btn btn-success"
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={simulating}
            >
              ✓ Stabilized / Resolve Alert
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
              Pending Dispatches
            </h4>
            {activeAlerts.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                No active alarms in database.
              </p>
            ) : (
              activeAlerts.map(alert => (
                <div key={alert._id} className="glass-card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{alert.victimId?.name}</span>
                    <span className={`badge badge-${alert.aiAnalysis?.severity}`}>{alert.aiAnalysis?.severity}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0' }}>
                    {alert.aiAnalysis?.summary || alert.transcript}
                  </p>
                  <button
                    onClick={() => handleRespond(alert)}
                    className="btn btn-outline"
                    style={{ width: '100%', fontSize: '0.75rem', padding: '0.5rem' }}
                  >
                    Accept Dispatch & Route
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Map display */}
      <div className="dashboard-main" style={{ position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <Toast
        message={toastMessage}
        type={toastType}
        visible={!!toastMessage}
        onClose={() => setToastMessage('')}
      />
    </div>
  )
}

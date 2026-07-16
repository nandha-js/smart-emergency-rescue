import { useState, useEffect } from 'react'
import useSocket from '../hooks/useSocket'
import { getAlerts, getGeofences, postGeofence } from '../services/api'
import StatsBar from '../components/Dashboard/StatsBar'
import AlertFeed from '../components/Dashboard/AlertFeed'
import EmergencyMap from '../components/Dashboard/EmergencyMap'
import AlertDetail from '../components/Dashboard/AlertDetail'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Toast from '../components/common/Toast'

export default function DashboardPage() {
  const { alerts, setAlerts, respondToAlert, resolveAlert, socket } = useSocket()
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')
  const [geofences, setGeofences] = useState([])
  const [geofenceMode, setGeofenceMode] = useState(false)

  // Fetch alerts & Geofences on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const alertsRes = await getAlerts()
        if (alertsRes.data.success) {
          setAlerts(alertsRes.data.alerts)
        }
        const geofenceRes = await getGeofences()
        if (geofenceRes.data.success) {
          setGeofences(geofenceRes.data.geofences)
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
        setToastMessage('Database connection down. Proximity networks offline.')
        setToastType('error')
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [setAlerts])

  // Websocket listeners for real-time danger zones
  useEffect(() => {
    if (!socket) return

    const handleNewGeofence = (gf) => {
      setGeofences((prev) => [gf, ...prev])
      setToastMessage(`⚠️ DANGER ZONE CREATED: "${gf.name}"`)
      setToastType('warning')
    }

    const handleGeofenceRemoved = (id) => {
      setGeofences((prev) => prev.filter((g) => g._id !== id))
    }

    socket.on('new-geofence', handleNewGeofence)
    socket.on('geofence-removed', handleGeofenceRemoved)

    return () => {
      socket.off('new-geofence', handleNewGeofence)
      socket.off('geofence-removed', handleGeofenceRemoved)
    }
  }, [socket])

  const handleSelectAlert = (alert) => {
    setSelectedAlert(alert)
  }

  const handleCloseDetail = () => {
    setSelectedAlert(null)
  }

  const handleRespond = async (id, responderName) => {
    try {
      const result = await respondToAlert(id, responderName)
      if (result.success) {
        setSelectedAlert(result.alert)
        setToastMessage(`Responder dispatched: ${responderName}`)
        setToastType('success')
      }
    } catch (err) {
      setToastMessage('Failed to update dispatch status.')
      setToastType('error')
    }
  }

  const handleResolve = async (id) => {
    try {
      const result = await resolveAlert(id)
      if (result.success) {
        setSelectedAlert(result.alert)
        setToastMessage('Emergency status closed.')
        setToastType('success')
      }
    } catch (err) {
      setToastMessage('Failed to resolve alert status.')
      setToastType('error')
    }
  }

  const handlePublishGeofence = async (geofenceData) => {
    try {
      const response = await postGeofence(geofenceData)
      if (response.data.success) {
        setGeofenceMode(false)
        setToastMessage(`Danger zone published successfully: "${geofenceData.name}"`)
        setToastType('success')
      }
    } catch (err) {
      console.error('Failed to save geofence:', err)
      setToastMessage('Failed to publish danger zone.')
      setToastType('error')
    }
  }

  if (loading) {
    return <LoadingSpinner message="Connecting to rescue command control..." />
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Incident Feed</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
                Live emergency tracking
              </p>
            </div>
            <button
              onClick={() => setGeofenceMode(prev => !prev)}
              className={`btn ${geofenceMode ? 'btn-danger' : 'btn-outline'}`}
              style={{ fontSize: '0.7rem', padding: '0.40rem 0.65rem' }}
            >
              {geofenceMode ? 'Cancel Geofence' : '📐 Draw Geofence'}
            </button>
          </div>
        </div>

        {/* Stats counter bar */}
        <StatsBar alerts={alerts} />

        {/* Alert Cards Feed */}
        <AlertFeed
          alerts={alerts}
          selectedAlert={selectedAlert}
          onSelectAlert={handleSelectAlert}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      {/* Main Map Area */}
      <div className="dashboard-main" style={{ position: 'relative' }}>
        {geofenceMode && (
          <div
            style={{
              position: 'absolute',
              top: '15px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(220, 38, 38, 0.95)',
              color: '#fff',
              padding: '0.6rem 1rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              zIndex: 1000,
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span className="live-dot" style={{ background: '#fff', width: '8px', height: '8px' }}></span>
            GEOFENCE DRAWING ACTIVE: CLICK MAP TO DRAW BOUNDARY
          </div>
        )}
        <EmergencyMap
          alerts={alerts}
          selectedAlert={selectedAlert}
          geofences={geofences}
          geofenceMode={geofenceMode}
          onPublishGeofence={handlePublishGeofence}
        />
      </div>

      {/* Expanded Log Modal */}
      {selectedAlert && (
        <AlertDetail
          alert={selectedAlert}
          onClose={handleCloseDetail}
          onRespond={handleRespond}
          onResolve={handleResolve}
        />
      )}

      {/* Dynamic Toast Feed */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={!!toastMessage}
        onClose={() => setToastMessage('')}
      />
    </div>
  )
}

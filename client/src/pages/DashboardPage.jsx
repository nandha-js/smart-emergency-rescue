import { useState, useEffect } from 'react'
import useSocket from '../hooks/useSocket'
import { getAlerts } from '../services/api'
import StatsBar from '../components/Dashboard/StatsBar'
import AlertFeed from '../components/Dashboard/AlertFeed'
import EmergencyMap from '../components/Dashboard/EmergencyMap'
import AlertDetail from '../components/Dashboard/AlertDetail'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Toast from '../components/common/Toast'

export default function DashboardPage() {
  const { alerts, setAlerts, respondToAlert, resolveAlert } = useSocket()
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await getAlerts()
        if (response.data.success) {
          setAlerts(response.data.alerts)
        }
      } catch (error) {
        console.error('Failed to load historical SOS alerts:', error)
        setToastMessage('Database connection down. Real-time stream active.')
        setToastType('error')
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [setAlerts])

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

  if (loading) {
    return <LoadingSpinner message="Connecting to rescue command control..." />
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Incident Feed</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
            Live emergency coordinate tracking
          </p>
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
      <div className="dashboard-main">
        <EmergencyMap alerts={alerts} selectedAlert={selectedAlert} />
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

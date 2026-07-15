function formatTimeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function AlertFeed({
  alerts = [],
  selectedAlert,
  onSelectAlert,
  statusFilter,
  onFilterChange,
}) {
  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter === 'all') return true
    return alert.status === statusFilter
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All
        </button>
        <button
          className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => onFilterChange('active')}
        >
          Active
        </button>
        <button
          className={`filter-tab ${statusFilter === 'responding' ? 'active' : ''}`}
          onClick={() => onFilterChange('responding')}
        >
          Resp.
        </button>
        <button
          className={`filter-tab ${statusFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => onFilterChange('resolved')}
        >
          Reso.
        </button>
      </div>

      {/* Feed list */}
      <div className="alert-feed" style={{ flex: 1, overflowY: 'auto' }}>
        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <svg
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              style={{ opacity: 0.3, marginBottom: '1rem' }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>No emergency signals found</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isSelected = selectedAlert && selectedAlert._id === alert._id
            const severity = alert.aiAnalysis?.severity || 'high'
            const isDistressed = alert.aiAnalysis?.isDistressed ?? true

            return (
              <div
                key={alert._id}
                className={`alert-card glass-card severity-${severity} ${
                  isSelected ? 'selected' : ''
                }`}
                onClick={() => onSelectAlert(alert)}
              >
                <div className="alert-header">
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: 'var(--color-text)',
                    }}
                  >
                    {alert.victimId?.name || 'Unknown Patient'}
                  </span>
                  <span className="alert-time">{formatTimeAgo(alert.createdAt || alert.updatedAt)}</span>
                </div>

                <div className="alert-summary">
                  {alert.aiAnalysis?.summary || alert.transcript || 'Transmitting payload...'}
                </div>

                <div className="alert-meta">
                  <span className={`badge badge-${severity}`}>
                    {severity}
                  </span>
                  <span className={`badge badge-${alert.status}`}>
                    {alert.status}
                  </span>
                  {alert.triggerMethod === 'voice' && (
                    <span
                      className="badge badge-low"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontSize: '0.65rem',
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="10"
                        height="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      </svg>
                      Voice
                    </span>
                  )}
                  {isDistressed && (
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontSize: '0.65rem',
                      }}
                    >
                      AI Distress
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

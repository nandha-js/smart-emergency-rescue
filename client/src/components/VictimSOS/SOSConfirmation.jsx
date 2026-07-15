export default function SOSConfirmation({ alert, onReset }) {
  if (!alert) return null

  const formattedTime = new Date(alert.createdAt || Date.now()).toLocaleTimeString()

  return (
    <div className="sos-confirmation">
      <div className="sos-confirmation-card">
        <div className="sos-checkmark" style={{ margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            viewBox="0 0 52 52"
            width="40"
            height="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: 'checkmark-draw 0.5s ease-out forwards' }} />
          </svg>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
          SOS SIGNAL ACTIVE
        </h2>
        <p style={{ color: 'var(--color-success)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.5rem' }}>
          Emergency Response Dispatching
        </p>

        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
            fontSize: '0.85rem',
            lineHeight: '1.5',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Alert ID:</span>{' '}
            <code style={{ color: 'var(--color-info)', fontSize: '0.75rem' }}>{alert._id}</code>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Transmitted:</span> {formattedTime}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>GPS:</span>{' '}
            {alert.location?.coordinates?.[1]?.toFixed(6)}, {alert.location?.coordinates?.[0]?.toFixed(6)}
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Trigger Method:</span>{' '}
            <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>{alert.triggerMethod}</span>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(234, 179, 8, 0.08)',
            borderLeft: '3px solid var(--color-warning)',
            padding: '0.75rem',
            borderRadius: '0 8px 8px 0',
            fontSize: '0.8rem',
            textAlign: 'left',
            lineHeight: '1.4',
            marginBottom: '1.5rem',
          }}
        >
          <strong>⚠️ Immediate Safety Directions:</strong>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', color: 'var(--color-text-secondary)' }}>
            <li>Find a secure, cover location if possible.</li>
            <li>Keep the mobile app screen active and browser open.</li>
            <li>Prepare details of your emergency for voice query.</li>
          </ul>
        </div>

        <button className="btn btn-outline" style={{ width: '100%' }} onClick={onReset}>
          Send Additional SOS
        </button>
      </div>
    </div>
  )
}

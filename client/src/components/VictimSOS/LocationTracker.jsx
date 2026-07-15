export default function LocationTracker({ latitude, longitude, accuracy, error, loading, onRetry }) {
  return (
    <div className="location-tracker glass-card" style={{ width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onRetry}
          title="Click to refresh/request GPS location permissions"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
            outline: 'none',
          }}
          className="gps-refresh-btn"
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke={error ? 'var(--color-danger)' : 'var(--color-success)'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              GPS Location Status
            </span>
            <span
              className={`location-dot ${error ? 'error' : ''}`}
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: error ? 'var(--color-danger)' : 'var(--color-success)',
              }}
            />
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            {loading ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Acquiring precise satellite signals...
              </span>
            ) : error ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 500 }}>
                {error} (Click pin to retry)
              </span>
            ) : (
              <div className="location-coords" style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                <div>
                  <span style={{ opacity: 0.6 }}>LAT:</span> {latitude?.toFixed(6)}
                </div>
                <div>
                  <span style={{ opacity: 0.6 }}>LNG:</span> {longitude?.toFixed(6)}
                </div>
                <div>
                  <span style={{ opacity: 0.6 }}>ACC:</span> ±{accuracy?.toFixed(1)}m
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

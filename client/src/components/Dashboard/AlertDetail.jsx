import PatientCard from './PatientCard'

export default function AlertDetail({ alert, onClose, onRespond, onResolve }) {
  if (!alert) return null

  const severity = alert.aiAnalysis?.severity || 'high'
  const isDistressed = alert.aiAnalysis?.isDistressed ?? true
  const hasVoice = alert.triggerMethod === 'voice'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Severity Banner */}
        <div className={`modal-severity-banner ${severity}`}>
          🚨 EMERGENCY LEVEL: {severity} ALERT
        </div>

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Rescue Signal Log</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Alert ID: {alert._id}
            </span>
          </div>
          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Patient Profile */}
        <PatientCard patient={alert.victimId} />

        {/* AI Distress Analysis */}
        <div className="ai-analysis-section glass-card" style={{ marginTop: '1rem', padding: '1rem' }}>
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-info)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
            Gemini Edge AI Validation
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className={`badge badge-${severity}`}>{severity} Severity</span>
            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              Intent: {alert.aiAnalysis?.intent || 'Emergency SOS'}
            </span>
            {isDistressed && (
              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                Active Distress
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.4', fontStyle: 'italic', color: 'var(--color-text)' }}>
            "{alert.aiAnalysis?.summary || 'Distress analysis matches rapid SOS protocol.'}"
          </p>
        </div>

        {/* Voice Transcript section */}
        {alert.transcript && (
          <div className="glass-card" style={{ marginTop: '1rem', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              Microphone Transcript Feed
            </h4>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                lineHeight: '1.45',
                border: '1px solid var(--color-border)',
                maxHeight: '100px',
                overflowY: 'auto',
              }}
            >
              {alert.transcript}
            </div>
          </div>
        )}

        {/* Audio Blackbox Evidence Feed */}
        {alert.audioClips && alert.audioClips.length > 0 && (
          <div className="glass-card" style={{ marginTop: '1rem', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              🎙️ Stealth Blackbox Audio Evidence ({alert.audioClips.length})
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                maxHeight: '120px',
                overflowY: 'auto',
                paddingRight: '0.5rem'
              }}
            >
              {alert.audioClips.map((clip, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                    Clip #{idx + 1} - {new Date(clip.createdAt).toLocaleTimeString()}
                  </span>
                  <audio
                    controls
                    src={`data:audio/webm;base64,${clip.data}`}
                    style={{ height: '24px', maxWidth: '180px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alert Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="glass-card" style={{ padding: '0.75rem' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
              LOCATION GPS
            </span>
            <code style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>
              {alert.location?.coordinates?.[1]?.toFixed(6)}, {alert.location?.coordinates?.[0]?.toFixed(6)}
            </code>
          </div>
          <div className="glass-card" style={{ padding: '0.75rem' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
              TRIGGER METHOD
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {alert.triggerMethod === 'voice' ? '🗣️ Voice Keyword Auto-Trigger' : '📱 Physical Button Hold'}
            </span>
          </div>
        </div>

        {/* Responder Note */}
        {alert.responderNote && (
          <div className="glass-card" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
              RESPONDER LOG / DISPATCH UNIT
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚨</span> {alert.responderNote}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
          {alert.status === 'active' && (
            <button
              className="btn btn-success"
              style={{ flex: 1, padding: '0.85rem' }}
              onClick={() => {
                const name = prompt('Enter responder name or hospital vehicle unit:', 'Ambulance 01')
                if (name) onRespond(alert._id, name)
              }}
            >
              🚀 Dispatch First Responder
            </button>
          )}

          {alert.status === 'responding' && (
            <button
              className="btn btn-success"
              style={{ flex: 1, padding: '0.85rem', background: 'var(--color-success)' }}
              onClick={() => {
                if (confirm('Verify patient is stabilized and incident resolved?')) onResolve(alert._id)
              }}
            >
              ✓ Stabilized / Resolve Alert
            </button>
          )}

          {alert.status === 'resolved' && (
            <div
              style={{
                width: '100%',
                padding: '0.75rem',
                textAlign: 'center',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '8px',
                color: 'var(--color-success)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              ✓ Stabilized & Closed by Rescuer
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

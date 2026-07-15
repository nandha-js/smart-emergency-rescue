export default function VoiceRecognition({
  isListening,
  onToggle,
  transcript,
  interimTranscript,
  detectedKeyword,
  isSupported,
  onTranscriptChange,
}) {
  return (
    <div className="voice-section glass-card" style={{ marginTop: '1.5rem', width: '100%', maxWidth: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
          Voice & Text Intake (Hands-Free)
        </h3>
        {isSupported ? (
          <button
            onClick={onToggle}
            className={`voice-toggle ${isListening ? 'active' : ''}`}
            aria-label="Toggle Voice Control"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        ) : (
          <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>UNSUPPORTED</span>
        )}
      </div>

      {!isSupported && (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          Your browser does not support the Web Speech API. Please use Google Chrome or Microsoft Edge.
        </p>
      )}

      {isSupported && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Status: {isListening ? 'Listening for keywords...' : 'Inactive (Type or Speak)'}
            </span>
            {isListening && (
              <div className="voice-waves">
                <span className="voice-wave-bar" style={{ animationDelay: '0.1s' }} />
                <span className="voice-wave-bar" style={{ animationDelay: '0.2s' }} />
                <span className="voice-wave-bar" style={{ animationDelay: '0.3s' }} />
                <span className="voice-wave-bar" style={{ animationDelay: '0.4s' }} />
                <span className="voice-wave-bar" style={{ animationDelay: '0.5s' }} />
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              value={transcript}
              onChange={(e) => onTranscriptChange(e.target.value)}
              placeholder='Type your emergency details here, or click the mic to speak (e.g., "Help", "Emergency").'
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                minHeight: '80px',
                fontSize: '0.85rem',
                lineHeight: '1.45',
                color: 'var(--color-text)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            {interimTranscript && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '12px',
                  fontSize: '0.8rem',
                  opacity: 0.6,
                  color: 'var(--color-info)',
                  pointerEvents: 'none',
                }}
              >
                {interimTranscript}
              </span>
            )}
          </div>

          {detectedKeyword && (
            <div className="voice-keyword-alert" style={{ marginTop: '1rem' }}>
              <strong>⚠️ DISTRESS DETECTED!</strong>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Auto-trigger keyword match: "{detectedKeyword}"
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

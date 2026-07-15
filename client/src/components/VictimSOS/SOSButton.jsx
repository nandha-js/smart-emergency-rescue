import { useState, useEffect, useRef } from 'react'

export default function SOSButton({ onTrigger, disabled, triggered }) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (holding) {
      startTimeRef.current = Date.now()
      setCountdown(3)
      setProgress(0)

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        const pct = Math.min((elapsed / 3000) * 100, 100)
        setProgress(pct)
        setCountdown(Math.max(3 - Math.floor(elapsed / 1000), 1))

        // Vibrate slightly during holding
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }

        if (elapsed >= 3000) {
          clearInterval(timerRef.current)
          setHolding(false)
          setProgress(100)
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200])
          }
          onTrigger()
        }
      }, 50)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setProgress(0)
      setCountdown(3)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [holding, onTrigger])

  const handleStart = (e) => {
    if (disabled || triggered) return
    e.preventDefault()
    setHolding(true)
  }

  const handleEnd = () => {
    setHolding(false)
  }

  // Circular progress stroke dash offsets
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="sos-button-wrapper">
      {!disabled && !triggered && (
        <>
          <div className="sos-ring" />
          <div className="sos-ring" />
          <div className="sos-ring" />
        </>
      )}

      <svg className="sos-progress-ring" width="220" height="220">
        <circle
          className="progress-ring-bg"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="8"
          fill="transparent"
          r={radius}
          cx="110"
          cy="110"
        />
        <circle
          className="progress-ring-bar"
          stroke="var(--color-danger)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="110"
          cy="110"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: holding ? 'none' : 'stroke-dashoffset 0.3s ease',
          }}
        />
      </svg>

      <button
        className={`sos-button ${holding ? 'holding' : ''} ${
          triggered ? 'triggered' : ''
        }`}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        disabled={disabled || triggered}
      >
        {triggered ? (
          <span style={{ fontSize: '1.2rem' }}>SENT ✓</span>
        ) : holding ? (
          <div className="hold-text">
            <span className="count">{countdown}</span>
            <span className="sub">HOLDING</span>
          </div>
        ) : (
          <div className="idle-text">
            <span>HOLD</span>
            <span className="bold">SOS</span>
          </div>
        )}
      </button>
    </div>
  )
}

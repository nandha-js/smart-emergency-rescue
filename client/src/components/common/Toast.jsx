import { useEffect } from 'react'

export default function Toast({ message, type = 'info', visible, onClose }) {
  useEffect(() => {
    if (visible && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div className={`toast toast-${type} slide-in-right`}>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  )
}

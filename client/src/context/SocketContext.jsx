import { createContext, useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export const SocketContext = createContext(null)

function playNotificationBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1)

    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
  } catch (e) {
    // AudioContext not available
  }
}

export function SocketProvider({ children }) {
  const [alerts, setAlerts] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin
    const socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
    })

    socket.on('new-emergency', (alert) => {
      setAlerts((prev) => [alert, ...prev])
      playNotificationBeep()
    })

    socket.on('alert-updated', (updatedAlert) => {
      setAlerts((prev) =>
        prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a))
      )
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        alerts,
        setAlerts,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

import { useContext } from 'react'
import { SocketContext } from '../context/SocketContext.jsx'
import { updateAlert } from '../services/api.js'

export default function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }

  const { socket, alerts, setAlerts } = context

  const respondToAlert = async (alertId, responderName) => {
    try {
      const response = await updateAlert(alertId, {
        status: 'responding',
        respondedBy: responderName,
      })
      if (response.data.success) {
        setAlerts((prev) =>
          prev.map((a) => (a._id === alertId ? response.data.alert : a))
        )
      }
      return response.data
    } catch (error) {
      console.error('[useSocket] Error responding to alert:', error)
      throw error
    }
  }

  const resolveAlert = async (alertId) => {
    try {
      const response = await updateAlert(alertId, {
        status: 'resolved',
      })
      if (response.data.success) {
        setAlerts((prev) =>
          prev.map((a) => (a._id === alertId ? response.data.alert : a))
        )
      }
      return response.data
    } catch (error) {
      console.error('[useSocket] Error resolving alert:', error)
      throw error
    }
  }

  return {
    socket,
    alerts,
    setAlerts,
    respondToAlert,
    resolveAlert,
  }
}

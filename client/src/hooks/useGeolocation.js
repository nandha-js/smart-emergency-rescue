import { useState, useEffect, useRef } from 'react'

export default function useGeolocation() {
  const [state, setState] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  })
  const watchIdRef = useRef(null)

  const startTracking = () => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    const onSuccess = (position) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false,
      })
    }

    const onError = (err) => {
      setState((prev) => ({
        ...prev,
        error: err.message,
        loading: false,
      }))
    }

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    })
  }

  useEffect(() => {
    startTracking()
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return {
    ...state,
    retry: startTracking
  }
}

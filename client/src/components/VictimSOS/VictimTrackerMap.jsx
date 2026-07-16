import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import useSocket from '../../hooks/useSocket'

export default function VictimTrackerMap({ alert }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const responderMarkerRef = useRef(null)
  const [responderLocation, setResponderLocation] = useState(null)
  const { socket } = useSocket()

  const [vLng, vLat] = alert?.location?.coordinates || [0, 0]

  // Listen to responder GPS socket updates
  useEffect(() => {
    if (!socket || !alert) return

    const handleGpsUpdate = (data) => {
      if (data.alertId === alert._id) {
        setResponderLocation({ lat: data.latitude, lng: data.longitude })
      }
    }

    socket.on('responder-gps-broadcast', handleGpsUpdate)
    return () => {
      socket.off('responder-gps-broadcast', handleGpsUpdate)
    }
  }, [socket, alert])

  // Initialize Map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([vLat, vLng], 14)

    L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map)

    // Victim marker
    L.marker([vLat, vLng], {
      icon: L.divIcon({
        className: 'emergency-marker active',
        html: '<div style="background:#ef4444; width:15px; height:15px; border-radius:50%"></div>',
        iconSize: [15, 15],
      })
    }).addTo(map).bindPopup('Your Location').openPopup()

    mapRef.current = map

    setTimeout(() => {
      map.invalidateSize()
    }, 250)
  }, [vLat, vLng])

  // Update Responder Ambulance marker on coordinates change
  useEffect(() => {
    if (!mapRef.current || !responderLocation) return

    const { lat, lng } = responderLocation

    if (responderMarkerRef.current) {
      responderMarkerRef.current.setLatLng([lat, lng])
    } else {
      responderMarkerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'responder-marker-wrapper',
          html: '<div style="background:#f59e0b; width:15px; height:15px; border-radius:50%; border:2px solid #fff"></div>',
          iconSize: [15, 15],
        })
      }).addTo(mapRef.current).bindPopup('First Responder Unit').openPopup()
    }

    // Fit map bounds to show both markers
    mapRef.current.fitBounds([
      [lat, lng],
      [vLat, vLng]
    ], { padding: [40, 40] })

  }, [responderLocation, vLat, vLng])

  return (
    <div className="glass-card" style={{ width: '100%', maxWidth: '440px', height: '220px', marginTop: '1rem', overflow: 'hidden' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function EmergencyMap({
  alerts = [],
  selectedAlert,
  geofences = [],
  geofenceMode = false,
  onPublishGeofence
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerLayerGroupRef = useRef(null)
  const geofenceLayerGroupRef = useRef(null)

  // Initialize Map
  useEffect(() => {
    if (mapRef.current) return

    // India Center Default
    const defaultCenter = [20.5937, 78.9629]
    const defaultZoom = 5

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(defaultCenter, defaultZoom)

    // Force Leaflet to recalculate container bounds after rendering
    setTimeout(() => {
      map.invalidateSize()
    }, 250)

    // Dark Theme Base Tiles
    L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map)

    const markerLayerGroup = L.layerGroup().addTo(map)
    const geofenceLayerGroup = L.layerGroup().addTo(map)

    mapRef.current = map
    markerLayerGroupRef.current = markerLayerGroup
    geofenceLayerGroupRef.current = geofenceLayerGroup

    // Cleanup on unmount
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update Markers when alerts array changes
  useEffect(() => {
    if (!mapRef.current || !markerLayerGroupRef.current) return

    const markerLayerGroup = markerLayerGroupRef.current
    markerLayerGroup.clearLayers()

    alerts.forEach((alert) => {
      if (!alert.location || !alert.location.coordinates) return
      const [lng, lat] = alert.location.coordinates

      // Custom divIcon marker matching index.css class definitions
      const markerHtml = `<div class="emergency-marker ${alert.status}"></div>`
      const customIcon = L.divIcon({
        className: 'emergency-marker-wrapper',
        html: markerHtml,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const marker = L.marker([lat, lng], { icon: customIcon })

      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 0.25rem;">
          <h4 style="margin: 0 0 0.25rem; font-weight: 700; color: #fff;">
            ${alert.victimId?.name || 'Unknown Patient'}
          </h4>
          <div style="font-size: 0.75rem; color: #aaa; margin-bottom: 0.5rem;">
            Blood Type: <span style="color: #ef4444; font-weight: 700;">${alert.victimId?.bloodType || 'N/A'}</span>
          </div>
          <div style="display: flex; gap: 0.25rem;">
            <span style="font-size: 0.65rem; text-transform: uppercase; font-weight:700; padding: 0.15rem 0.4rem; border-radius: 4px; background: rgba(239, 68, 68, 0.2); color: #ef4444;">
              ${alert.aiAnalysis?.severity || 'high'}
            </span>
            <span style="font-size: 0.65rem; text-transform: uppercase; font-weight:700; padding: 0.15rem 0.4rem; border-radius: 4px; background: rgba(255,255,255,0.08); color: #ccc;">
              ${alert.status}
            </span>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'leaflet-dark-popup',
      })

      markerLayerGroup.addLayer(marker)

      // Render ambulance marker if en route
      if (alert.responderLocation && alert.responderLocation.coordinates) {
        const [rLng, rLat] = alert.responderLocation.coordinates
        if (rLng !== 78.9629 && rLat !== 20.5937 && alert.status === 'responding') {
          const responderMarker = L.marker([rLat, rLng], {
            icon: L.divIcon({
              className: 'responder-marker-wrapper',
              html: '<div style="background:#f59e0b; width:15px; height:15px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px rgba(245,158,11,0.6)"></div>',
              iconSize: [15, 15],
            })
          })
          responderMarker.bindPopup(`
            <div style="font-family:'Inter',sans-serif; font-size:0.75rem; color:#fff; padding:0.2rem;">
              <strong>Ambulance Unit 5</strong><br/>
              Heading to ${alert.victimId?.name || 'Patient'}
            </div>
          `, { closeButton: false })
          markerLayerGroup.addLayer(responderMarker)
        }
      }
    })
  }, [alerts])

  // Pan and Fly to Selected Alert
  useEffect(() => {
    if (!mapRef.current || !selectedAlert) return
    if (!selectedAlert.location || !selectedAlert.location.coordinates) return

    const [lng, lat] = selectedAlert.location.coordinates
    mapRef.current.flyTo([lat, lng], 13, {
      animate: true,
      duration: 1.5,
    })
  }, [selectedAlert])

  // Map click handler for drawing Geofences
  useEffect(() => {
    if (!mapRef.current) return

    const handleMapClick = (e) => {
      if (!geofenceMode) return

      const { lat, lng } = e.latlng
      const name = prompt('Enter Danger Zone / Geofence Name:', 'Active Hazard Area')
      if (!name) return

      const radiusStr = prompt('Enter Danger Zone Radius (in meters):', '200')
      if (!radiusStr) return
      const radius = parseFloat(radiusStr)
      if (isNaN(radius) || radius <= 0) {
        alert('Invalid radius value.')
        return
      }

      if (onPublishGeofence) {
        onPublishGeofence({ name, latitude: lat, longitude: lng, radius })
      }
    }

    const map = mapRef.current
    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [geofenceMode, onPublishGeofence])

  // Update Geofences Layer
  useEffect(() => {
    if (!mapRef.current || !geofenceLayerGroupRef.current) return

    const geofenceLayerGroup = geofenceLayerGroupRef.current
    geofenceLayerGroup.clearLayers()

    geofences.forEach((gf) => {
      if (!gf.location || !gf.location.coordinates) return
      const [lng, lat] = gf.location.coordinates

      const circle = L.circle([lat, lng], {
        color: '#dc2626',
        fillColor: '#dc2626',
        fillOpacity: 0.18,
        radius: gf.radius,
        weight: 2,
        dashArray: '5, 5',
      })

      circle.bindPopup(`
        <div style="font-family:'Inter',sans-serif; font-size:0.75rem; color:#fff; padding:0.2rem;">
          <strong>⚠️ DANGER ZONE: ${gf.name}</strong><br/>
          Radius: ${gf.radius}m
        </div>
      `, { closeButton: false })

      geofenceLayerGroup.addLayer(circle)
    })
  }, [geofences])

  return (
    <div className="map-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

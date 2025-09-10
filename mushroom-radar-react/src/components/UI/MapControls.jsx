import React from 'react'
import { useDashboard } from '../../context/DashboardContext'
import './MapControls.css'

const MapControls = () => {
  const { state } = useDashboard()

  const handleGeolocate = () => {
    if (state.map && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords
          state.map.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            essential: true
          })
        },
        (error) => {
          console.warn('Geolocation error:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000
        }
      )
    }
  }

  const handleCompass = () => {
    if (state.map) {
      state.map.flyTo({
        bearing: 0,
        pitch: 45,
        essential: true
      })
    }
  }

  return (
    <div className="map-controls">
      <button
        className="map-control-button"
        onClick={handleGeolocate}
        aria-label="Find my location"
        title="Find my location"
      >
        <img 
          src="./assets/location.png" 
          alt="Find my location" 
          className="map-control-icon"
        />
      </button>
      
      <button
        className="map-control-button"
        onClick={handleCompass}
        aria-label="Point north"
        title="Point north"
      >
        <img 
          src="./assets/compass.png" 
          alt="Point north" 
          className="map-control-icon"
        />
      </button>
    </div>
  )
}

export default MapControls

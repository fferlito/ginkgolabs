import React from 'react'
import { useDashboard } from '../../context/DashboardContext'
import './BasemapToggle.css'

const BasemapToggle = () => {
  const { state, dispatch } = useDashboard()

  const handleToggle = () => {
    console.log('BasemapToggle clicked - current style:', state.currentMapStyle)
    const newStyle = state.currentMapStyle === 'custom' ? 'satellite' : 'custom'
    dispatch({ type: 'SET_MAP_STYLE', payload: newStyle })
    console.log('BasemapToggle dispatched SET_MAP_STYLE with:', newStyle)
  }

  const buttonText = state.currentMapStyle === 'custom' ? 'Satellite' : 'Custom'
  const isActive = state.currentMapStyle === 'satellite'

  return (
    <button
      className={`basemap-toggle-round ${isActive ? 'active' : ''}`}
      onClick={handleToggle}
      aria-label={`Switch to ${buttonText} view`}
      title={`Switch to ${buttonText} view`}
    >
      <img 
        src="./assets/map_icon.png" 
        alt="Map toggle" 
        className="map-icon"
      />
    </button>
  )
}

export default BasemapToggle

import React from 'react'
import { useDashboard } from '../../context/DashboardContext'
import './BasemapToggle.css'

const BasemapToggle = () => {
  const { state, dispatch } = useDashboard()

  const handleToggle = () => {
    const newStyle = state.currentMapStyle === 'custom' ? 'satellite' : 'custom'
    dispatch({ type: 'SET_MAP_STYLE', payload: newStyle })
  }

  const buttonText = state.currentMapStyle === 'custom' ? 'Satellite' : 'Custom'
  const isActive = state.currentMapStyle === 'satellite'

  return (
    <button
      className={`basemap-toggle ${isActive ? 'active' : ''}`}
      onClick={handleToggle}
      aria-label={`Switch to ${buttonText} view`}
    >
      {buttonText}
    </button>
  )
}

export default BasemapToggle

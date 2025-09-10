import React from 'react'
import { useDashboard } from '../../context/DashboardContext'
import './MushroomToggle.css'

const MushroomToggle = () => {
  const { state, dispatch } = useDashboard()

  const handleClick = () => {
    // Toggle mushroom layer visibility
    dispatch({ type: 'TOGGLE_MUSHROOM_LAYER' })
  }

  const isActive = state.showMushroomLayer !== false // Default to true

  return (
    <button
      className={`mushroom-toggle ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      aria-label="Toggle mushroom predictions"
      title="Toggle mushroom predictions"
    >
      <div className="mushroom-icon-container">
        <img 
          src="/assets/mushroom.png" 
          alt="Mushroom predictions" 
          className="mushroom-icon"
        />
      </div>
      <div className="mushroom-text">
        <span className="mushroom-name">Porcini</span>
        <span className="mushroom-scientific">Boletus edulis</span>
      </div>
    </button>
  )
}

export default MushroomToggle

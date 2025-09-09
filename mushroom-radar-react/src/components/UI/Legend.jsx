import React from 'react'
import { useDashboard } from '../../context/DashboardContext'
import './Legend.css'

const Legend = () => {
  const { state, dispatch } = useDashboard()

  const handleLayerToggle = () => {
    dispatch({ type: 'TOGGLE_LAYER_VISIBILITY' })
  }

  return (
    <div className="legend-container">
      <div className="legend-inline-wrapper">
        <div className="layer-checkbox-wrapper">
          <input
            type="checkbox"
            id="layer-checkbox"
            className="layer-checkbox"
            checked={state.layerVisible}
            onChange={handleLayerToggle}
          />
          <label htmlFor="layer-checkbox" className="layer-checkbox-label">
            {/* Layer toggle label can be added here if needed */}
          </label>
        </div>
        <span className="legend-label">Probability %</span>
        <div className="legend-gradient">
          <div className="legend-values-inline">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Legend

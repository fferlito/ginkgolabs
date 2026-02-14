import React from 'react'
import DateSelector from '../Calendar/DateSelector'
import Legend from './Legend'
import './TimelineLegend.css'

const TimelineLegend = () => {
  return (
    <div className="timeline-legend-container">
      <div className="timeline-section">
        <DateSelector />
      </div>
      <div className="legend-section">
        <Legend />
      </div>
    </div>
  )
}

export default TimelineLegend

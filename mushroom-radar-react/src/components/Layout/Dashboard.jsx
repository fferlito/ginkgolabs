import React from 'react'
import Header from './Header'
import MapContainer from '../Map/MapContainer'
import DateSelector from '../Calendar/DateSelector'
import BasemapToggle from '../UI/BasemapToggle'
import MushroomToggle from '../UI/MushroomToggle'
import MapControls from '../UI/MapControls'
import Legend from '../UI/Legend'
import './Dashboard.css'

const Dashboard = () => {
  return (
    <div className="dashboard">
      <Header />
      <main className="dashboard-main">
        <MapContainer />
        <div className="dashboard-controls-left">
          <MushroomToggle />
          <DateSelector />
        </div>
        <div className="dashboard-controls-right">
          <BasemapToggle />
          <MapControls />
        </div>
        <Legend />
      </main>
    </div>
  )
}

export default Dashboard

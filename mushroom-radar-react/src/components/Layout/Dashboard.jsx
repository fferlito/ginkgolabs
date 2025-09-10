import React from 'react'
import Header from './Header'
import MapContainer from '../Map/MapContainer'
import BasemapToggle from '../UI/BasemapToggle'
import MushroomToggle from '../UI/MushroomToggle'
import MapControls from '../UI/MapControls'
import TimelineLegend from '../UI/TimelineLegend'
import './Dashboard.css'

const Dashboard = () => {
  return (
    <div className="dashboard">
      <Header showNavigation={false} />
      <main className="dashboard-main">
        <MapContainer />
        <div className="dashboard-controls-left">
          <MushroomToggle />
        </div>
        <div className="dashboard-controls-right">
          <BasemapToggle />
          <MapControls />
        </div>
        <TimelineLegend />
      </main>
    </div>
  )
}

export default Dashboard

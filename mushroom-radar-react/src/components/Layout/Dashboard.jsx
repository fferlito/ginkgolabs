import React from 'react'
import Header from './Header'
import MapContainer from '../Map/MapContainer'
import DateSelector from '../Calendar/DateSelector'
import BasemapToggle from '../UI/BasemapToggle'
import Legend from '../UI/Legend'
import './Dashboard.css'

const Dashboard = () => {
  return (
    <div className="dashboard">
      <Header />
      <main className="dashboard-main">
        <MapContainer />
        <div className="dashboard-controls">
          <DateSelector />
          <BasemapToggle />
        </div>
        <Legend />
      </main>
    </div>
  )
}

export default Dashboard

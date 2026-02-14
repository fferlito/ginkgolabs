import React from 'react'
import Dashboard from './components/Layout/Dashboard'
import { DashboardProvider } from './context/DashboardContext'
import 'mapbox-gl/dist/mapbox-gl.css'
import './styles/App.css'

function App() {
  return (
    <DashboardProvider>
      <div className="app">
        <Dashboard />
      </div>
    </DashboardProvider>
  )
}

export default App

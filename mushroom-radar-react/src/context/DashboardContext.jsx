import React, { createContext, useContext, useReducer, useEffect } from 'react'
import moment from 'moment'
import { initializeTileURLs } from '../services/ellipsisApi'

const DashboardContext = createContext()

// Initial state
const initialState = {
  selectedDate: moment().format('YYYY-MM-DD'),
  currentMapStyle: 'custom',
  layerVisible: true,
  tileUrls: {
    today: 'https://api.ellipsis-drive.com/v3/ogc/mvt/49821b18-5a0f-4b5f-871d-6442d1c72d86/{z}/{x}/{y}?timestampId=f1033c35-2589-4e84-b110-b0705d6ea1c0&token=epat_HEBbajYglphtALIrw0rKI9PA0w3Dyssp9oUDymLFksir8coa89tw921Glvb5ZFah',
    tomorrow: 'https://api.ellipsis-drive.com/v3/ogc/mvt/49821b19-5a0f-4b5f-871d-6442d1c72d86/{z}/{x}/{y}?timestampId=4f1e918b-3df4-4e59-b2e9-52547222c3d5&token=epat_VZGivZ6q1DNcq6lZybdZD9tjOooNlWpmz4Dff0T59m8VOBXQcQWhLFBs31PjKFWV',
    later: 'https://api.ellipsis-drive.com/v3/ogc/mvt/49821b20-5a0f-4b5f-871d-6442d1c72d86/{z}/{x}/{y}?timestampId=4f1e918b-3df4-4e59-b2e9-52547222c3d5&token=epat_VZGivZ6q1DNcq6lZybdZD9tjOooNlWpmz4Dff0T59m8VOBXQcQWhLFBs31PjKFWV'
  },
  map: null,
  isMapLoaded: false,
  isLoadingTileUrls: false
}

// Reducer
const dashboardReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SELECTED_DATE':
      return { 
        ...state, 
        selectedDate: action.payload 
      }
    case 'SET_MAP_STYLE':
      return { 
        ...state, 
        currentMapStyle: action.payload 
      }
    case 'TOGGLE_LAYER_VISIBILITY':
      return { 
        ...state, 
        layerVisible: !state.layerVisible 
      }
    case 'SET_LAYER_VISIBILITY':
      return { 
        ...state, 
        layerVisible: action.payload 
      }
    case 'SET_MAP':
      return { 
        ...state, 
        map: action.payload 
      }
    case 'SET_MAP_LOADED':
      return { 
        ...state, 
        isMapLoaded: action.payload 
      }
    case 'UPDATE_TILE_URLS':
      return { 
        ...state, 
        tileUrls: { ...state.tileUrls, ...action.payload } 
      }
    case 'SET_LOADING_TILE_URLS':
      return { 
        ...state, 
        isLoadingTileUrls: action.payload 
      }
    default:
      return state
  }
}

// Provider component
export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

  // Initialize tile URLs on mount
  useEffect(() => {
    const loadTileUrls = async () => {
      dispatch({ type: 'SET_LOADING_TILE_URLS', payload: true })
      try {
        const updatedUrls = await initializeTileURLs()
        dispatch({ type: 'UPDATE_TILE_URLS', payload: updatedUrls })
      } catch (error) {
        console.warn('Failed to initialize tile URLs:', error)
      } finally {
        dispatch({ type: 'SET_LOADING_TILE_URLS', payload: false })
      }
    }

    loadTileUrls()
  }, [])

  // Map styles configuration
  const mapStyles = {
    custom: 'mapbox://styles/ferlixxx/cm8xkvecy000o01s6fy1h60qi',
    satellite: 'mapbox://styles/mapbox/satellite-v9'
  }

  // Get current tile URL based on selected date
  const getCurrentTileUrl = (selectedDate) => {
    const today = moment().startOf('day')
    const selected = moment(selectedDate)
    
    if (selected.isSame(today, 'day')) return state.tileUrls.today
    if (selected.isSame(today.clone().add(1, 'day'), 'day')) return state.tileUrls.tomorrow
    return state.tileUrls.later
  }

  const value = {
    state,
    dispatch,
    mapStyles,
    getCurrentTileUrl
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

// Custom hook to use the dashboard context
export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

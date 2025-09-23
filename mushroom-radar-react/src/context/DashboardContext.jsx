import React, { createContext, useContext, useReducer, useEffect } from 'react';
import moment from 'moment';
import { initializeTileURLs } from '../services/ellipsisApi';
import { loadMushroomData } from '../services/mushroomService';

const DashboardContext = createContext();

// Initial state
const initialState = {
  selectedDate: moment().format('YYYY-MM-DD'),
  currentMapStyle: 'custom',
  layerVisible: true,
  showMushroomLayer: true,
  showMushroomSelection: false,
  mushrooms: [],
  selectedMushroom: null,
  tileUrls: {
    today: [],
    tomorrow: [],
    later: [],
  },
  map: null,
  isMapLoaded: false,
  isLoadingTileUrls: false,
  isLoadingMushroomData: true,
};

// Reducer
const dashboardReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_MUSHROOM_SELECTION':
      return {
        ...state,
        showMushroomSelection: !state.showMushroomSelection,
      };
    case 'SET_MUSHROOM_DATA':
      return {
        ...state,
        mushrooms: action.payload.allMushrooms,
        selectedMushroom: action.payload.defaultMushroom,
        tileUrls: action.payload.defaultMushroom.tileUrls,
        isLoadingMushroomData: false,
      };
    case 'SET_SELECTED_MUSHROOM':
      return {
        ...state,
        selectedMushroom: action.payload,
        tileUrls: action.payload.tileUrls,
        showMushroomSelection: false, // Close the popup after selection
      };
    case 'SET_SELECTED_DATE':
      return {
        ...state,
        selectedDate: action.payload,
      };
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
    case 'TOGGLE_MUSHROOM_LAYER':
      return {
        ...state,
        showMushroomLayer: !state.showMushroomLayer
      }
    case 'SET_MUSHROOM_LAYER':
      return { 
        ...state, 
        showMushroomLayer: action.payload 
      }
    default:
      return state
  }
}

// Provider component
export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Initialize mushroom data and tile URLs on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const { allMushrooms, defaultMushroom } = await loadMushroomData();
        dispatch({ type: 'SET_MUSHROOM_DATA', payload: { allMushrooms, defaultMushroom } });
      } catch (error) {
        console.error('Failed to load mushroom data:', error);
        // Handle error, maybe set a default state or show an error message
      }
    };

    loadData();
  }, []);


  // Map styles configuration
  const mapStyles = {
    custom: 'mapbox://styles/ferlixxx/cm8xkvecy000o01s6fy1h60qi',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12'
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

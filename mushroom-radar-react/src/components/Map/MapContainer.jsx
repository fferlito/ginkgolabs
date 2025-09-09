import React, { useRef, useCallback, useEffect } from 'react'
import Map, { Source, Layer, NavigationControl, GeolocateControl } from 'react-map-gl'
import mapboxgl from 'mapbox-gl'
import { useDashboard } from '../../context/DashboardContext'
import MushroomPopup from './MushroomPopup'
import './MapContainer.css'

// Set Mapbox access token (from environment variable or fallback)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZmVybGl4eHgiLCJhIjoiY2xvbXFvcm8xMnBkMTJrbjA4bXF4NnBhdyJ9.Jzb2pKR5fsS2Nj3OikRLJg'

const MapContainer = () => {
  const mapRef = useRef()
  const { state, dispatch, mapStyles, getCurrentTileUrl } = useDashboard()
  const [popupInfo, setPopupInfo] = React.useState(null)

  const onMapLoad = useCallback((event) => {
    const map = event.target
    
    // Store map instance in context
    dispatch({ type: 'SET_MAP', payload: map })
    dispatch({ type: 'SET_MAP_LOADED', payload: true })

    // Add 3D terrain
    map.addSource('mapbox-dem', {
      'type': 'raster-dem',
      'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
      'tileSize': 512,
      'maxzoom': 14
    })

    // Add the DEM source as a terrain layer with exaggerated height
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 })

    // Add a sky layer for better 3D effect
    map.addLayer({
      'id': 'sky',
      'type': 'sky',
      'paint': {
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun': [0.0, 0.0],
        'sky-atmosphere-sun-intensity': 15
      }
    })
  }, [dispatch])

  const onClick = useCallback((event) => {
    const { features, lngLat } = event
    
    // Check if clicked on mushroom layer
    const mushroomFeature = features?.find(f => f.layer?.id === 'mushroom-fill')
    
    if (mushroomFeature?.properties?.species_prediction !== undefined) {
      setPopupInfo({
        longitude: lngLat.lng,
        latitude: lngLat.lat,
        prediction: mushroomFeature.properties.species_prediction
      })
    } else {
      setPopupInfo(null)
    }
  }, [])

  // Get current tile URL
  const currentTileUrl = getCurrentTileUrl(state.selectedDate)

  // Layer paint configuration
  const mushroomLayerPaint = {
    'fill-color': [
      'case',
      ['has', 'species_prediction'],
      ['interpolate', ['linear'], ['get', 'species_prediction'],
        0.0, '#9F0500',
        0.2, '#ba5c00',
        0.4, '#c77500',
        0.6, '#cfa100',
        0.8, '#a1d600',
        1.0, '#68bc00'
      ],
      '#c75b1c' // fallback if missing
    ],
    'fill-opacity': 0.6
  }

  return (
    <div className="map-container">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 11.3285,
          latitude: 43.3188,
          zoom: 9,
          pitch: 45,
          bearing: 0
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyles[state.currentMapStyle]}
        onLoad={onMapLoad}
        onClick={onClick}
        interactiveLayerIds={['mushroom-fill']}
        attributionControl={false}
        logoPosition="bottom-right"
        antialias={true}
      >
        {/* Mushroom data source and layer */}
        {state.layerVisible && currentTileUrl && (
          <Source
            id="mushroom-polygons"
            type="vector"
            tiles={[currentTileUrl]}
            minzoom={0}
            maxzoom={22}
          >
            <Layer
              id="mushroom-fill"
              type="fill"
              source-layer="layer"
              paint={mushroomLayerPaint}
            />
          </Source>
        )}

        {/* Navigation Controls */}
        <NavigationControl
          position="bottom-right"
          showCompass={true}
          showZoom={true}
          visualizePitch={true}
        />

        {/* Geolocate Control */}
        <GeolocateControl
          position="bottom-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          showAccuracyCircle={false}
        />

        {/* Popup */}
        {popupInfo && (
          <MushroomPopup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            prediction={popupInfo.prediction}
            onClose={() => setPopupInfo(null)}
          />
        )}
      </Map>
    </div>
  )
}

export default MapContainer

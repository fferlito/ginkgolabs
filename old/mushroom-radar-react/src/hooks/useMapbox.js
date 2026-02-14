import { useState, useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZmVybGl4eHgiLCJhIjoiY2xvbXFvcm8xMnBkMTJrbjA4bXF4NnBhdyJ9.Jzb2pKR5fsS2Nj3OikRLJg'

export const useMapbox = (options = {}) => {
  const [map, setMap] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(null)
  const mapContainer = useRef(null)

  const {
    style = 'mapbox://styles/ferlixxx/cm8xkvecy000o01s6fy1h60qi',
    center = [11.3285, 43.3188],
    zoom = 9,
    pitch = 45,
    bearing = 0,
    ...otherOptions
  } = options

  useEffect(() => {
    if (!mapContainer.current) return

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style,
        center,
        zoom,
        pitch,
        bearing,
        attributionControl: false,
        logoPosition: 'bottom-right',
        antialias: true,
        ...otherOptions
      })

      mapInstance.on('load', () => {
        setIsLoaded(true)
        setMap(mapInstance)
      })

      mapInstance.on('error', (e) => {
        console.warn('Mapbox error:', e.error)
        setError(e.error)
      })

      // Cleanup function
      return () => {
        mapInstance.remove()
      }
    } catch (err) {
      setError(err)
      console.error('Failed to initialize map:', err)
    }
  }, [style, center, zoom, pitch, bearing])

  const addLayer = (layer) => {
    if (map && isLoaded) {
      try {
        map.addLayer(layer)
      } catch (err) {
        console.warn('Error adding layer:', err)
      }
    }
  }

  const removeLayer = (layerId) => {
    if (map && isLoaded) {
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId)
        }
      } catch (err) {
        console.warn('Error removing layer:', err)
      }
    }
  }

  const addSource = (sourceId, source) => {
    if (map && isLoaded) {
      try {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, source)
        }
      } catch (err) {
        console.warn('Error adding source:', err)
      }
    }
  }

  const removeSource = (sourceId) => {
    if (map && isLoaded) {
      try {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId)
        }
      } catch (err) {
        console.warn('Error removing source:', err)
      }
    }
  }

  return {
    mapContainer,
    map,
    isLoaded,
    error,
    addLayer,
    removeLayer,
    addSource,
    removeSource
  }
}

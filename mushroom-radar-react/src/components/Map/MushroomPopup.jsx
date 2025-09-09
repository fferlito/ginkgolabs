import React from 'react'
import { Popup } from 'react-map-gl'

const MushroomPopup = ({ longitude, latitude, prediction, onClose }) => {
  const lat = latitude.toFixed(6)
  const lng = longitude.toFixed(6)
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      offset={8}
      onClose={onClose}
      closeOnClick={true}
      className="mushroom-popup"
    >
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        Probability: {(prediction * 100).toFixed(1)}%<br />
        <a 
          href={googleMapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#007bff', 
            textDecoration: 'none', 
            fontSize: '0.9em' 
          }}
        >
          (Open in Maps)
        </a>
      </div>
    </Popup>
  )
}

export default MushroomPopup

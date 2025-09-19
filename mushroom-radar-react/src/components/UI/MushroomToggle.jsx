import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import './MushroomToggle.css';

const MushroomToggle = ({
  mushroomName,
  scientificName,
  icon,
  onClick,
  isActive: isActiveProp,
}) => {
  const { state, dispatch } = useDashboard();

  const handleButtonClick = onClick || (() => {
    dispatch({ type: 'TOGGLE_MUSHROOM_SELECTION' });
  });

  const handleVisibilityToggle = (e) => {
    e.stopPropagation(); // Prevent the main button click
    dispatch({ type: 'TOGGLE_LAYER_VISIBILITY' });
  };

  const isActive = isActiveProp !== undefined ? isActiveProp : state.showMushroomLayer;
  const isLayerVisible = state.layerVisible;

  // Only show the visibility toggle on the main dashboard button (when onClick is not provided)
  const showVisibilityToggle = !onClick;

  return (
    <button
      className={`mushroom-toggle ${isActive ? 'active' : ''}`}
      onClick={handleButtonClick}
      aria-label="Toggle mushroom predictions"
      title="Toggle mushroom predictions"
    >
      <div className="mushroom-icon-container">
        <img
          src={icon || './assets/mushroom.png'}
          alt="Mushroom predictions"
          className="mushroom-icon"
        />
      </div>
      <div className="mushroom-text">
        <span className="mushroom-name">{mushroomName || 'Porcini'}</span>
        <span className="mushroom-scientific">
          {scientificName || 'Boletus edulis'}
        </span>
      </div>
      {showVisibilityToggle && (
        <div className="visibility-toggle" onClick={handleVisibilityToggle}>
          <img
            src={isLayerVisible ? './assets/eye.png' : './assets/eye_closed.png'}
            alt={isLayerVisible ? 'Layer visible' : 'Layer hidden'}
            className="visibility-icon"
          />
        </div>
      )}
    </button>
  );
};

export default MushroomToggle;

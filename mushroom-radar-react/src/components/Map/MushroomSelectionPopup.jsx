import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import MushroomToggle from '../UI/MushroomToggle';
import './MushroomSelectionPopup.css';

const MushroomSelectionPopup = ({ onClose }) => {
  const { state, dispatch } = useDashboard();
  const { mushrooms, selectedMushroom, isLoadingMushroomData } = state;

  const handleSelectMushroom = (mushroom) => {
    dispatch({ type: 'SET_SELECTED_MUSHROOM', payload: mushroom });
  };

  if (isLoadingMushroomData) {
    return <div>Loading mushrooms...</div>;
  }

  return (
    <div className="mushroom-selection-popup-overlay">
      <div className="mushroom-selection-popup">
        <div className="mushroom-selection-header">
          <h2>Select a Mushroom</h2>
          <button onClick={onClose} className="close-button">
            &times;
          </button>
        </div>
        <div className="mushroom-grid">
          {mushrooms.map((mushroom) => (
            <MushroomToggle
              key={mushroom.scientificName}
              mushroomName={mushroom.name}
              scientificName={mushroom.scientificName}
              icon={mushroom.icon}
              isActive={selectedMushroom?.scientificName === mushroom.scientificName}
              onClick={() => handleSelectMushroom(mushroom)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MushroomSelectionPopup;

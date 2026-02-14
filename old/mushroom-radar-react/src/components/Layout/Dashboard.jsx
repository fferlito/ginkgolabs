import React from 'react';
import Header from './Header';
import MapContainer from '../Map/MapContainer';
import BasemapToggle from '../UI/BasemapToggle';
import MushroomToggle from '../UI/MushroomToggle';
import MapControls from '../UI/MapControls';
import TimelineLegend from '../UI/TimelineLegend';
import MushroomSelectionPopup from '../Map/MushroomSelectionPopup';
import { useDashboard } from '../../context/DashboardContext';
import './Dashboard.css';

const Dashboard = () => {
  const { state, dispatch } = useDashboard();
  const { selectedMushroom, isLoadingMushroomData } = state;

  return (
    <div className="dashboard">
      <Header showNavigation={false} />
      <main className="dashboard-main">
        <MapContainer />
        <div className="dashboard-controls-left">
          {isLoadingMushroomData ? (
            <div>Loading...</div>
          ) : (
            <MushroomToggle
              mushroomName={selectedMushroom?.name}
              scientificName={selectedMushroom?.scientificName}
              icon={selectedMushroom?.icon}
              isActive={state.showMushroomLayer}
            />
          )}
        </div>
        <div className="dashboard-controls-right">
          <BasemapToggle />
          <MapControls />
        </div>
        <TimelineLegend />
        {state.showMushroomSelection && (
          <MushroomSelectionPopup onClose={() => dispatch({ type: 'TOGGLE_MUSHROOM_SELECTION' })} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;

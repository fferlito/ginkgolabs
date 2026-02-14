import "mapbox-gl/dist/mapbox-gl.css";
import { DashboardProvider, useDashboard } from "../context/dashboard-context";
import { MapContainer } from "../components/dashboard/MapContainer";
import { MushroomToggle } from "../components/dashboard/MushroomToggle";
import { BasemapToggle } from "../components/dashboard/BasemapToggle";
import { MapControls } from "../components/dashboard/MapControls";
import { TimelineLegend } from "../components/dashboard/TimelineLegend";
import { MushroomSelectionPopup } from "../components/dashboard/MushroomSelectionPopup";

function DashboardContent() {
  const { state, dispatch } = useDashboard();
  const { selectedMushroom, isLoadingMushroomData } = state;

  return (
    <>
      <div className="absolute inset-0 pt-0">
        <MapContainer />
      </div>

      <div className="pointer-events-none absolute left-5 top-[95px] z-[1001] flex flex-col gap-3 md:top-[95px]">
        <div className="pointer-events-auto">
          {isLoadingMushroomData ? (
            <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#0A0E0C]/90 px-4 py-3 text-sm text-[#9CA89F]">
              Loading...
            </div>
          ) : (
            <MushroomToggle
              mushroomName={selectedMushroom?.name}
              scientificName={selectedMushroom?.scientificName}
              icon={selectedMushroom?.icon}
              isActive={state.showMushroomLayer}
            />
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute right-5 top-[95px] z-[1001] flex flex-col gap-2 md:top-[95px]">
        <div className="pointer-events-auto">
          <BasemapToggle />
        </div>
        <div className="pointer-events-auto">
          <MapControls />
        </div>
      </div>

      <TimelineLegend />

      {state.showMushroomSelection && (
        <MushroomSelectionPopup
          onClose={() => dispatch({ type: "TOGGLE_MUSHROOM_SELECTION" })}
        />
      )}
    </>
  );
}

export function DashboardPage() {
  return (
    <DashboardProvider>
      <div className="relative h-[calc(100vh-4rem)] w-full">
        <DashboardContent />
      </div>
    </DashboardProvider>
  );
}

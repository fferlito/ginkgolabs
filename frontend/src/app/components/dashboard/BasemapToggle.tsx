import { Map, Satellite } from "lucide-react";
import { useDashboard } from "../../context/dashboard-context";

export function BasemapToggle() {
  const { state, dispatch } = useDashboard();

  const handleToggle = () => {
    const next =
      state.currentMapStyle === "custom" ? "satellite" : "custom";
    dispatch({ type: "SET_MAP_STYLE", payload: next });
  };

  const isSatellite = state.currentMapStyle === "satellite";

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-md transition-all ${
        isSatellite
          ? "border-[#2D5F3F] bg-[#2D5F3F] text-[#F5F5F0]"
          : "border-[#2D5F3F]/30 bg-[#0A0E0C]/90 text-[#F5F5F0] backdrop-blur hover:scale-105 hover:border-[#2D5F3F]"
      }`}
      aria-label={isSatellite ? "Switch to map view" : "Switch to satellite view"}
      title={isSatellite ? "Custom map" : "Satellite"}
    >
      {isSatellite ? (
        <Satellite className="h-6 w-6" />
      ) : (
        <Map className="h-6 w-6" />
      )}
    </button>
  );
}

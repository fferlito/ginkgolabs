import { Locate, Compass } from "lucide-react";
import { useDashboard } from "../../context/dashboard-context";

export function MapControls() {
  const { state } = useDashboard();

  const handleGeolocate = () => {
    if (state.map && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          state.map!.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            essential: true,
          });
        },
        (err) => console.warn("Geolocation error:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    }
  };

  const handleCompass = () => {
    if (state.map) {
      state.map.flyTo({
        bearing: 0,
        pitch: 45,
        essential: true,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleGeolocate}
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#2D5F3F]/30 bg-[#0A0E0C]/90 text-[#F5F5F0] shadow-md backdrop-blur transition-all hover:scale-105 hover:border-[#2D5F3F]"
        aria-label="Find my location"
        title="Find my location"
      >
        <Locate className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={handleCompass}
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#2D5F3F]/30 bg-[#0A0E0C]/90 text-[#F5F5F0] shadow-md backdrop-blur transition-all hover:scale-105 hover:border-[#2D5F3F]"
        aria-label="Point north"
        title="Point north"
      >
        <Compass className="h-6 w-6" />
      </button>
    </div>
  );
}

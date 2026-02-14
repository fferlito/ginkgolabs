import { useDashboard } from "../../context/dashboard-context";
import { MushroomToggle } from "./MushroomToggle";
import type { MushroomData } from "../../data/mushrooms/types";

interface MushroomSelectionPopupProps {
  onClose: () => void;
}

export function MushroomSelectionPopup({ onClose }: MushroomSelectionPopupProps) {
  const { state, dispatch } = useDashboard();
  const { mushrooms, selectedMushroom, isLoadingMushroomData } = state;

  const handleSelect = (mushroom: MushroomData) => {
    dispatch({ type: "SET_SELECTED_MUSHROOM", payload: mushroom });
  };

  if (isLoadingMushroomData) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="rounded-xl bg-[#1B3022] px-8 py-6 text-[#F5F5F0]">
          Loading mushrooms...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2D5F3F]/30 bg-[#0A0E0C] p-5 text-[#F5F5F0]">
        <div className="mb-4 flex items-center justify-between border-b border-[#2D5F3F]/30 pb-3">
          <h2 className="text-lg font-semibold">Select a Mushroom</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-[#9CA89F] hover:text-[#F5F5F0]"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mushrooms.map((mushroom) => (
            <MushroomToggle
              key={mushroom.scientificName}
              mushroomName={mushroom.name}
              scientificName={mushroom.scientificName}
              icon={mushroom.icon}
              isActive={selectedMushroom?.scientificName === mushroom.scientificName}
              onClick={() => handleSelect(mushroom)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

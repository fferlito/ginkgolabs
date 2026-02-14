import { Leaf, Eye, EyeOff } from "lucide-react";
import { useDashboard } from "../../context/dashboard-context";

interface MushroomToggleProps {
  mushroomName?: string;
  scientificName?: string;
  icon?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function MushroomToggle({
  mushroomName = "Porcini",
  scientificName = "Boletus edulis",
  icon,
  isActive: isActiveProp,
  onClick,
}: MushroomToggleProps) {
  const { state, dispatch } = useDashboard();

  const handleButtonClick =
    onClick === undefined
      ? () => dispatch({ type: "TOGGLE_MUSHROOM_SELECTION" })
      : onClick;

  const handleVisibilityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "TOGGLE_LAYER_VISIBILITY" });
  };

  const isActive = isActiveProp !== undefined ? isActiveProp : state.showMushroomLayer;
  const isLayerVisible = state.layerVisible;
  const showVisibilityToggle = onClick === undefined;

  const activeClass =
    "border-[#2D5F3F] bg-[#2D5F3F] text-[#F5F5F0]";
  const inactiveClass =
    "border-[#2D5F3F]/30 bg-[#0A0E0C]/90 text-[#F5F5F0] backdrop-blur hover:scale-[1.02] hover:border-[#2D5F3F]";

  return (
    <button
      type="button"
      onClick={handleButtonClick}
      className={`flex min-w-[200px] items-center gap-3 rounded-xl border-2 px-4 py-2 shadow-md transition-all ${isActive ? activeClass : inactiveClass}`}
      aria-label="Toggle mushroom predictions"
      title="Toggle mushroom predictions"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1B3022]">
        {icon && !icon.startsWith(".") ? (
          <img src={icon} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <Leaf className="h-5 w-5 text-[#4A7C5D]" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span className="truncate text-sm font-semibold">{mushroomName}</span>
        <span className="truncate text-xs italic text-[#9CA89F]">
          {scientificName}
        </span>
      </div>
      {showVisibilityToggle && (
        <button
          type="button"
          onClick={handleVisibilityToggle}
          className="ml-2 flex items-center justify-center border-l border-[#2D5F3F]/30 pl-2"
          aria-label={isLayerVisible ? "Layer visible" : "Layer hidden"}
        >
          {isLayerVisible ? (
            <Eye className="h-5 w-5 text-[#F5F5F0]" />
          ) : (
            <EyeOff className="h-5 w-5 text-[#9CA89F]" />
          )}
        </button>
      )}
    </button>
  );
}

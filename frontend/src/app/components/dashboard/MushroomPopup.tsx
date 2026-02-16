import { Popup } from "react-map-gl";

interface MushroomPopupProps {
  longitude: number;
  latitude: number;
  prediction: number;
  onClose: () => void;
  onShowStats?: () => void;
}

export function MushroomPopup({
  longitude,
  latitude,
  prediction,
  onClose,
  onShowStats,
}: MushroomPopupProps) {
  const lat = latitude.toFixed(6);
  const lng = longitude.toFixed(6);
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      offset={8}
      onClose={onClose}
      closeOnClick
      className="mushroom-popup"
    >
      <div className="flex flex-col items-center gap-1 p-2 text-white">
        <span className="font-semibold">
          Probability: {(prediction * 100).toFixed(1)}%
        </span>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#4A7C5D] hover:text-[#6B9A7C] hover:underline"
        >
          (Open in Maps)
        </a>
        {onShowStats && (
          <button
            type="button"
            onClick={() => onShowStats()}
            className="text-sm text-[#4A7C5D] hover:text-[#6B9A7C] hover:underline mt-1"
          >
            Show stats
          </button>
        )}
      </div>
    </Popup>
  );
}

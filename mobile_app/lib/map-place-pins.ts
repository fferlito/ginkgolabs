export type MapPlacePin = {
  id: string;
  name: string;
  notes: string | null;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
};

let pins: MapPlacePin[] = [];

export function getMapPlacePins(): MapPlacePin[] {
  return pins;
}

export function upsertMapPlacePin(pin: MapPlacePin) {
  const prev = pins.find((row) => row.id === pin.id);
  const next: MapPlacePin = {
    ...pin,
    photoUrl: pin.photoUrl ?? prev?.photoUrl ?? null,
  };
  pins = [...pins.filter((row) => row.id !== pin.id), next];
}

export function removeMapPlacePin(id: string) {
  pins = pins.filter((row) => row.id !== id);
}

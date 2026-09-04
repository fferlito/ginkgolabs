import { Linking, Share } from "react-native";

export function mapsDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export async function openNavigation(latitude: number, longitude: number): Promise<void> {
  await Linking.openURL(mapsDirectionsUrl(latitude, longitude));
}

export async function shareObservation(opts: {
  name: string;
  scientificName?: string | null;
  latitude: number;
  longitude: number;
}): Promise<void> {
  const lines = [opts.name];
  if (opts.scientificName) lines.push(opts.scientificName);
  lines.push(`${opts.latitude.toFixed(5)}, ${opts.longitude.toFixed(5)}`);
  lines.push(`https://www.google.com/maps?q=${opts.latitude},${opts.longitude}`);
  await Share.share({ message: lines.join("\n"), title: opts.name });
}

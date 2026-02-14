export interface MushroomTileUrls {
  today: string[];
  tomorrow: string[];
  later: string[];
}

export interface MushroomData {
  name: string;
  scientificName: string;
  icon?: string;
  default?: boolean;
  tileUrls: MushroomTileUrls;
}

function normalizeUrls(
  v: string | string[] | undefined
): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export function normalizeMushroomTileUrls(raw: {
  today?: string | string[];
  tomorrow?: string | string[];
  later?: string | string[];
}): MushroomTileUrls {
  return {
    today: normalizeUrls(raw.today),
    tomorrow: normalizeUrls(raw.tomorrow),
    later: normalizeUrls(raw.later),
  };
}

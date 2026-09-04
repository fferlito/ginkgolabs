import type { MushroomEntry, MushroomPhoto } from "./api";
import rawCatalog from "../data/pedia/catalog.json";

// Catalog photos are commercial-use only (no CC BY-NC).

type RawEntry = {
  id: string;
  scientificName: string;
  name?: string;
  names?: Record<string, string>;
  edible?: boolean;
  poisonous?: boolean;
  seasonMonths?: number[];
  photos?: MushroomPhoto[];
  description?: string | { en?: string };
  csv_file?: string | null;
  thumbUrl?: string;
};

function toEntry(row: RawEntry): MushroomEntry {
  const names = row.names ?? {};
  const description =
    typeof row.description === "string" ? row.description : row.description?.en ?? "";
  return {
    id: row.id,
    name: names.en || row.name || row.scientificName,
    scientificName: row.scientificName,
    names,
    edible: row.edible,
    poisonous: row.poisonous,
    seasonMonths: row.seasonMonths,
    photos: row.photos,
    thumbUrl: row.thumbUrl || row.photos?.[0]?.url,
    hasStats: Boolean(row.csv_file),
    description,
  };
}

const bundled = (rawCatalog as RawEntry[]).map(toEntry);

export function bundledPediaList(): MushroomEntry[] {
  return bundled;
}

export function bundledPediaById(id: string | undefined): MushroomEntry | undefined {
  if (!id) return undefined;
  return bundled.find((row) => row.id === id);
}

export function resolvePediaList(api: MushroomEntry[] | null | undefined): MushroomEntry[] {
  if (api && api.length >= 50) return api;
  return bundled;
}

export function resolvePediaDetail(
  id: string | undefined,
  api: MushroomEntry | null | undefined,
): MushroomEntry | null {
  const local = bundledPediaById(id);
  if (api && (api.photos?.length ?? 0) > 0) {
    return {
      ...local,
      ...api,
      names: Object.keys(api.names ?? {}).length > 2 ? api.names : local?.names ?? api.names,
      photos: api.photos?.length ? api.photos : local?.photos,
      thumbUrl: api.thumbUrl || local?.thumbUrl,
      description: api.description?.trim() ? api.description : local?.description,
      edible: api.edible ?? local?.edible,
      poisonous: api.poisonous ?? local?.poisonous,
      seasonMonths: api.seasonMonths?.length ? api.seasonMonths : local?.seasonMonths,
      hasStats: api.hasStats ?? local?.hasStats,
    };
  }
  return local ?? api ?? null;
}

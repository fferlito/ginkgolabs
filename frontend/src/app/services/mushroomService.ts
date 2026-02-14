import type { MushroomData } from "../data/mushrooms/types";
import { normalizeMushroomTileUrls } from "../data/mushrooms/types";

const mushroomModules = import.meta.glob<{ default: MushroomData }>(
  "../data/mushrooms/*.json"
);

export async function loadMushroomData(): Promise<{
  allMushrooms: MushroomData[];
  defaultMushroom: MushroomData;
}> {
  const loaders = Object.values(mushroomModules).map((fn) => fn());
  const modules = await Promise.all(loaders);
  const allMushrooms: MushroomData[] = modules.map((m) => {
    const d = m.default;
    return {
      ...d,
      tileUrls: normalizeMushroomTileUrls(d.tileUrls as Record<string, unknown>),
    };
  });
  const defaultMushroom =
    allMushrooms.find((m) => m.default) ?? allMushrooms[0];
  return { allMushrooms, defaultMushroom };
}

const BASE_URL =
  import.meta.env.VITE_ELLIPSIS_API_BASE || "https://api.ellipsis-drive.com/v3";
const PATH_ID =
  import.meta.env.VITE_ELLIPSIS_PATH_ID ||
  "b11909f0-3c51-4ab2-a57e-ffaa60335770";

export async function getTimestampId(pathId: string): Promise<string | null> {
  try {
    const urlListFolder = `${BASE_URL}/path/${pathId}/folder/list`;
    const response = await fetch(urlListFolder);
    if (!response.ok) return null;
    const data = await response.json();
    const timestamps = data.result;
    for (const item of timestamps) {
      const timestamp = item.vector?.timestamps?.[0];
      if (timestamp) return timestamp.id;
    }
    return null;
  } catch {
    return null;
  }
}

export async function replaceTimestampIdWithFetchedUUID(
  url: string,
  pathId: string
): Promise<string> {
  const timestampId = await getTimestampId(pathId);
  if (timestampId) {
    return url.replace(/timestampId=[^&]+/, `timestampId=${timestampId}`);
  }
  return url;
}

export interface TileUrlsSet {
  today: string[];
  tomorrow: string[];
  later: string[];
}

export async function updateTileURLs(
  tileUrls: TileUrlsSet
): Promise<TileUrlsSet> {
  const updated = { ...tileUrls };
  if (tileUrls.today?.length) {
    updated.today = await Promise.all(
      tileUrls.today.map((u) => replaceTimestampIdWithFetchedUUID(u, PATH_ID))
    );
  }
  if (tileUrls.tomorrow?.length) {
    updated.tomorrow = await Promise.all(
      tileUrls.tomorrow.map((u) =>
        replaceTimestampIdWithFetchedUUID(u, PATH_ID)
      )
    );
  }
  if (tileUrls.later?.length) {
    updated.later = await Promise.all(
      tileUrls.later.map((u) => replaceTimestampIdWithFetchedUUID(u, PATH_ID))
    );
  }
  return updated;
}

export async function initializeTileURLs(): Promise<TileUrlsSet> {
  const base =
    "https://storage.googleapis.com/mushroom-radar-tiles/tiles/{z}/{x}/{y}.pbf?nocache=1";
  return {
    today: [base],
    tomorrow: [base],
    later: [base],
  };
}

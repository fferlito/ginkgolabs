export type MapObservation = {
  id: string;
  speciesName: string;
  scientificName: string | null;
  observedOn: string;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  hunterName: string;
  mine: boolean;
};

export type ObservationCluster = {
  id: string;
  longitude: number;
  latitude: number;
  items: MapObservation[];
};

export type MapBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export function snapBounds(bounds: MapBounds): MapBounds {
  const round = (n: number) => Math.round(n * 200) / 200;
  return {
    west: round(bounds.west),
    south: round(bounds.south),
    east: round(bounds.east),
    north: round(bounds.north),
  };
}

export function boundsEqual(a: MapBounds | null, b: MapBounds): boolean {
  if (!a) return false;
  return a.west === b.west && a.south === b.south && a.east === b.east && a.north === b.north;
}

function padBounds(bounds: MapBounds, factor = 0.25): MapBounds {
  const lngPad = Math.max((bounds.east - bounds.west) * factor, 0.01);
  const latPad = Math.max((bounds.north - bounds.south) * factor, 0.01);
  return {
    west: bounds.west - lngPad,
    south: bounds.south - latPad,
    east: bounds.east + lngPad,
    north: bounds.north + latPad,
  };
}

function isUsableBounds(bounds: MapBounds): boolean {
  const width = bounds.east - bounds.west;
  const height = bounds.north - bounds.south;
  return width > 0.0001 && height > 0.0001 && width < 360 && height < 180;
}

function inBounds(point: MapObservation, bounds: MapBounds): boolean {
  return (
    point.longitude >= bounds.west &&
    point.longitude <= bounds.east &&
    point.latitude >= bounds.south &&
    point.latitude <= bounds.north
  );
}

function clusterCellDegrees(zoom: number): number {
  const z = Math.max(2, Math.min(20, zoom));
  return 180 / 2 ** (z + 1);
}

export function clusterObservations(
  points: MapObservation[],
  zoom: number,
  bounds: MapBounds | null,
  maxMarkers = 80,
): ObservationCluster[] {
  const filtered =
    bounds && isUsableBounds(bounds)
      ? points.filter((point) => inBounds(point, padBounds(bounds)))
      : points;
  const size = clusterCellDegrees(zoom);
  const buckets = new Map<string, MapObservation[]>();
  for (const point of filtered) {
    const gx = Math.round(point.longitude / size);
    const gy = Math.round(point.latitude / size);
    const key = `${gx}:${gy}`;
    const list = buckets.get(key);
    if (list) list.push(point);
    else buckets.set(key, [point]);
  }
  const clusters: ObservationCluster[] = [];
  for (const [key, items] of buckets) {
    let lng = 0;
    let lat = 0;
    for (const item of items) {
      lng += item.longitude;
      lat += item.latitude;
    }
    clusters.push({
      id: key,
      longitude: lng / items.length,
      latitude: lat / items.length,
      items,
    });
  }
  if (clusters.length <= maxMarkers) return clusters;
  clusters.sort((a, b) => b.items.length - a.items.length);
  return clusters.slice(0, maxMarkers);
}

export function clusterIsTight(cluster: ObservationCluster, zoom: number): boolean {
  if (cluster.items.length <= 1) return true;
  if (zoom >= 15) return true;
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const item of cluster.items) {
    minLng = Math.min(minLng, item.longitude);
    maxLng = Math.max(maxLng, item.longitude);
    minLat = Math.min(minLat, item.latitude);
    maxLat = Math.max(maxLat, item.latitude);
  }
  return maxLng - minLng < 0.0008 && maxLat - minLat < 0.0008;
}

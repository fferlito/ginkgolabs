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
  id?: string;
  tileUrls: MushroomTileUrls;
}

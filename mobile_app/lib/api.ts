const PRODUCTION_API = "https://backend-production-bc08.up.railway.app";

export function getApiBase(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return PRODUCTION_API;
}

function getApiKey(): string {
  return process.env.EXPO_PUBLIC_API_KEY?.trim() ?? "";
}

export async function apiGet<T>(path: string): Promise<T | null> {
  const headers: Record<string, string> = {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };
  const key = getApiKey();
  if (key) headers["X-API-Key"] = key;
  try {
    const res = await fetch(`${getApiBase()}${path}`, { headers });
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("text/html") || !res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiAuth<T>(
  path: string,
  token: string | null | undefined,
  init?: RequestInit,
): Promise<T> {
  if (!token) throw new ApiError(401, "Sign in required.");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!isForm && init?.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const raw = data as { detail?: unknown } | null;
    let detail = `Request failed (${res.status})`;
    if (typeof raw?.detail === "string") detail = raw.detail;
    else if (Array.isArray(raw?.detail)) detail = JSON.stringify(raw.detail);
    throw new ApiError(res.status, detail);
  }
  return data as T;
}

export type MushroomPhoto = {
  url: string;
  credit?: string;
  license?: string;
};

export type MushroomEntry = {
  id: string;
  name: string;
  scientificName: string;
  names?: Record<string, string>;
  edible?: boolean;
  poisonous?: boolean;
  seasonMonths?: number[];
  photos?: MushroomPhoto[];
  thumbUrl?: string;
  hasStats?: boolean;
  description?: string;
  statistics?: { label: string; value: string }[];
};

export type ClimateDay = {
  day: string;
  idealTemperature: number;
  idealTemperatureUpper?: number;
  idealTemperatureLower?: number;
  idealHumidity: number;
  idealHumidityUpper?: number;
  idealHumidityLower?: number;
  idealRain: number;
  idealRainUpper?: number;
  idealRainLower?: number;
  idealPressure?: number;
  idealPressureUpper?: number;
  idealPressureLower?: number;
};

export type Bin = {
  bin_start: number;
  bin_end: number;
  value?: number;
  count?: number;
};

export function relativeValues(bins: Bin[]): number[] {
  const nums = bins.map((b) => b.value ?? b.count ?? 0);
  const max = Math.max(...nums, 1);
  return nums.map((n) => (n / max) * 100);
}

export type Place = {
  id: string;
  name: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Observation = {
  id: string;
  speciesId: string | null;
  speciesName: string;
  scientificName: string | null;
  observedOn: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  notes: string | null;
  photoObject: string;
  photoUrl: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityObservation = {
  id: string;
  speciesName: string;
  scientificName: string | null;
  observedOn: string;
  latitude: number;
  longitude: number;
  photoUrl?: string | null;
  hunterName?: string;
  mine?: boolean;
};

export type IdentifyResult = {
  taxonId: number | null;
  scientificName: string;
  commonName: string;
  score: number;
  iconicTaxon: string;
};

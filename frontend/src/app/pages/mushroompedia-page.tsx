import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Backend API URL – must point to your FastAPI backend, not the frontend.
// 1) Use VITE_API_URL or VITE_MUSHROOM_API_BASE if set at build time.
// 2) In production (non-localhost), use the deployed backend so the app works without env.
// 3) Otherwise localhost:8000 for local dev.
const PRODUCTION_API_URL = "https://backend-production-bc08.up.railway.app";

function getApiBase(): string {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  const url = (env?.VITE_API_URL?.trim() || env?.VITE_MUSHROOM_API_BASE?.trim()) || "";
  if (url) return url;
  const isProduction = typeof window !== "undefined" && window.location?.hostname !== "localhost" && !window.location?.hostname?.startsWith("127.");
  return isProduction ? PRODUCTION_API_URL : "http://localhost:8000";
}
const API_BASE = getApiBase();

/** API key for backend (set VITE_API_KEY in Railway frontend env); sent as X-API-Key when set. */
function getApiKey(): string {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return (env?.VITE_API_KEY?.trim() ?? env?.VITE_MUSHROOM_API_KEY?.trim() ?? "") || "";
}
const API_KEY = getApiKey();

/** Default headers for API requests (cache bust + optional API key). */
function apiHeaders(overrides?: HeadersInit): HeadersInit {
  const h: Record<string, string> = {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    ...(overrides as Record<string, string>),
  };
  if (API_KEY) h["X-API-Key"] = API_KEY;
  return h;
}

/** Fetch JSON from API; returns null if response is HTML (wrong URL) or not ok. */
async function apiGet<T = unknown>(url: string, opts?: RequestInit): Promise<T | null> {
  const res = await fetch(url, { ...opts, headers: apiHeaders(opts?.headers) });
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) return null;
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type MushroomEntry = {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  statistics: { label: string; value: string }[];
};

type ClimateDay = {
  day: string;
  idealTemperature: number;
  idealTemperatureUpper: number;
  idealTemperatureLower: number;
  idealHumidity: number;
  idealHumidityUpper: number;
  idealHumidityLower: number;
  idealRain: number;
  idealRainUpper: number;
  idealRainLower: number;
  idealPressure?: number;
  idealPressureUpper?: number;
  idealPressureLower?: number;
};

/** Fallback synthetic season data (peak October). */
function fallbackSeasonData(): { month: string; activity: number }[] {
  const peakMonth = 9;
  const sigma = 5;
  return MONTHS.map((month, i) => ({
    month,
    activity: Math.round(100 * Math.exp(-Math.pow(i - peakMonth, 2) / sigma)),
  }));
}

/** Fallback 14-day ideal conditions. */
function fallbackChartData(): ClimateDay[] {
  const DAYS = 14;
  const TEMP_SD = 1.5;
  const HUMIDITY_SD = 8;
  const RAIN_SD = 0.5;
  const idealT = (i: number) => 15 + 2 * Math.sin((i / (DAYS - 1)) * Math.PI * 0.8);
  const idealH = (i: number) => 80 + 5 * Math.sin((i / (DAYS - 1)) * Math.PI * 0.8);
  const idealR = (i: number) => Math.max(0, 3 + 0.8 * Math.sin((i / (DAYS - 1)) * Math.PI * 0.8));
  return Array.from({ length: DAYS }, (_, i) => {
    const t = idealT(i);
    const h = idealH(i);
    const r = idealR(i);
    return {
      day: `Day ${i + 1}`,
      idealTemperature: Math.round(t * 10) / 10,
      idealTemperatureUpper: Math.round((t + TEMP_SD) * 10) / 10,
      idealTemperatureLower: Math.round((t - TEMP_SD) * 10) / 10,
      idealHumidity: Math.round(h * 10) / 10,
      idealHumidityUpper: Math.round((h + HUMIDITY_SD) * 10) / 10,
      idealHumidityLower: Math.round((h - HUMIDITY_SD) * 10) / 10,
      idealRain: Math.round(r * 10) / 10,
      idealRainUpper: Math.round((r + RAIN_SD) * 10) / 10,
      idealRainLower: Math.round(Math.max(0, r - RAIN_SD) * 10) / 10,
    };
  });
}

const FALLBACK_MUSHROOMS: MushroomEntry[] = [
  {
    id: "porcini",
    name: "Porcini",
    scientificName: "Boletus edulis",
    description: `The **porcini** (*Boletus edulis*) is one of the most sought-after wild mushrooms in the world. It has a nutty, earthy flavour and a firm, meaty texture that holds up well when cooked.

It forms a symbiotic relationship with trees (especially pine, spruce, and oak) and typically fruits from late summer into autumn, depending on region and weather. The cap is broad and brown; the underside has a spongy layer of pores instead of gills, and the stem is thick and often bulbous.

Porcini are used in risottos, pastas, soups, and sauces, and are also dried for long-term storage.`,
    statistics: [
      { label: "Season", value: "Late summer – autumn" },
      { label: "Habitat", value: "Coniferous & deciduous forest" },
      { label: "Edibility", value: "Choice edible" },
      { label: "Avg. cap size", value: "5–25 cm" },
      { label: "Conservation", value: "Widespread, not threatened" },
    ],
  },
];

export function MushroompediaPage() {
  const [mushrooms, setMushrooms] = useState<MushroomEntry[]>(FALLBACK_MUSHROOMS);
  const [selectedId, setSelectedId] = useState<string>(FALLBACK_MUSHROOMS[0].id);
  const [chartData, setChartData] = useState<ClimateDay[]>(fallbackChartData());
  const [seasonData, setSeasonData] = useState<{ month: string; activity: number }[]>(fallbackSeasonData());
  const [elevationBins, setElevationBins] = useState<{ bin_start: number; bin_end: number; count: number }[]>([]);
  const [slopeBins, setSlopeBins] = useState<{ bin_start: number; bin_end: number; count: number }[]>([]);
  const [aspectBins, setAspectBins] = useState<{ bin_start: number; bin_end: number; count: number }[]>([]);
  const [geomorphonCategories, setGeomorphonCategories] = useState<{ label: string; count: number }[]>([]);
  const [landcoverCategories, setLandcoverCategories] = useState<{ code: number; count: number }[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<MushroomEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [apiMisconfigured, setApiMisconfigured] = useState(false);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  // Use API-loaded detail when available, otherwise list entry
  const selectedFromList = mushrooms.find((m) => m.id === selectedId) ?? mushrooms[0];
  const selected: MushroomEntry = selectedDetail ?? selectedFromList;

  // Fetch mushroom list from API (sidebar) – no cache so list is fresh
  useEffect(() => {
    let cancelled = false;
    const noCache = { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } };
    apiGet<MushroomEntry[]>(`${API_BASE}/api/mushrooms`, noCache)
      .then((data) => {
        if (cancelled) return;
        if (data?.length) {
          setMushrooms(data);
          if (!data.some((m) => m.id === selectedId)) setSelectedId(data[0].id);
          setApiMisconfigured(false);
        } else {
          setApiMisconfigured(true);
        }
      })
      .catch(() => setApiMisconfigured(true))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Fetch current mushroom detail from API (name, description, statistics for the page)
  useEffect(() => {
    if (!selectedId) return;
    setDetailLoading(true);
    setSelectedDetail(null);
    const noCache = { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } };
    apiGet<MushroomEntry>(`${API_BASE}/api/mushrooms/${selectedId}`, noCache)
      .then((data) => {
        if (data && data.id === selectedId) {
          setSelectedDetail({
            id: data.id,
            name: data.name,
            scientificName: data.scientificName,
            description: data.description,
            statistics: data.statistics ?? [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  // Fetch chart data from API when selected mushroom changes (no cache, ignore stale responses)
  useEffect(() => {
    if (!selectedId) return;
    const id = selectedId;
    setChartsLoading(true);
    // Avoid cached responses so plots always show fresh API data
    const noCache = { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } };
    type ClimateRes = { days: ClimateDay[] };
    type SeasonRes = { months: { month: string; activity: number }[] };
    type BinsRes = { bins: { bin_start: number; bin_end: number; count: number }[] };
    type GeomorphonRes = { categories: { label: string; count: number }[] };
    type LandcoverRes = { categories: { code: number; count: number }[] };

    Promise.all([
      apiGet<ClimateRes>(`${API_BASE}/api/mushrooms/${id}/climate`, noCache),
      apiGet<SeasonRes>(`${API_BASE}/api/mushrooms/${id}/season`, noCache),
      apiGet<BinsRes>(`${API_BASE}/api/mushrooms/${id}/elevation`, noCache),
      apiGet<BinsRes>(`${API_BASE}/api/mushrooms/${id}/slope`, noCache),
      apiGet<BinsRes>(`${API_BASE}/api/mushrooms/${id}/aspect`, noCache),
      apiGet<GeomorphonRes>(`${API_BASE}/api/mushrooms/${id}/geomorphon`, noCache),
      apiGet<LandcoverRes>(`${API_BASE}/api/mushrooms/${id}/landcover`, noCache),
    ])
      .then(([climate, season, elevation, slope, aspect, geomorphon, landcover]) => {
        if (id !== selectedIdRef.current) return;
        if (climate?.days?.length) setChartData(climate.days);
        else setChartData(fallbackChartData());
        if (season?.months?.length) setSeasonData(season.months);
        else setSeasonData(fallbackSeasonData());
        setElevationBins(elevation?.bins?.length ? elevation.bins : []);
        setSlopeBins(slope?.bins?.length ? slope.bins : []);
        setAspectBins(aspect?.bins?.length ? aspect.bins : []);
        setGeomorphonCategories(geomorphon?.categories?.length ? geomorphon.categories : []);
        setLandcoverCategories(landcover?.categories?.length ? landcover.categories : []);
      })
      .catch(() => {
        if (id !== selectedIdRef.current) return;
        setChartData(fallbackChartData());
        setSeasonData(fallbackSeasonData());
        setElevationBins([]);
        setSlopeBins([]);
        setAspectBins([]);
        setGeomorphonCategories([]);
        setLandcoverCategories([]);
      })
      .finally(() => {
        if (id === selectedIdRef.current) setChartsLoading(false);
      });
  }, [selectedId]);

  return (
    <div className="min-h-screen bg-[#0A0E0C]">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F0] mb-6">
          Mushroompedia
        </h1>

        {apiMisconfigured && (
          <div className="mb-6 rounded-xl border border-amber-500/50 bg-amber-950/40 px-4 py-3 text-amber-200 text-sm">
            <strong>API not reached.</strong> Requests are getting the app page instead of JSON. Set{" "}
            <code className="rounded bg-black/30 px-1">VITE_API_URL</code> to your backend URL (e.g.{" "}
            <code className="rounded bg-black/30 px-1">https://your-backend.railway.app</code>) and rebuild the frontend. Using fallback data for now.
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Left sidebar: mushroom names */}
          <aside className="w-full md:w-56 shrink-0">
            <nav
              className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-2"
              aria-label="Mushroom list"
            >
              <ul className="space-y-0.5">
                {mushrooms.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(m.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedId === m.id
                          ? "bg-[#2D5F3F] text-[#F5F5F0]"
                          : "text-[#9CA89F] hover:bg-[#2D5F3F]/30 hover:text-[#F5F5F0]"
                      }`}
                    >
                      {m.name}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content: loaded from API (GET /api/mushrooms, /api/mushrooms/:id, climate, season, etc.) */}
          <article className="flex-1 min-w-0 rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6 sm:p-8 text-[#F5F5F0]">
            <header className="border-b border-[#2D5F3F]/30 pb-4 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#F5F5F0]">
                {selected.name}
              </h2>
              <p className="text-[#4A7C5D] italic mt-1">
                {selected.scientificName}
                {detailLoading && (
                  <span className="ml-2 text-xs text-[#9CA89F] normal-case">(loading…)</span>
                )}
              </p>
            </header>

            <section className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9CA89F] mb-2">
                Description
              </h3>
              <div className="prose prose-invert prose-sm max-w-none text-[#F5F5F0]/90 leading-relaxed space-y-2 [&_strong]:text-[#F5F5F0] [&_strong]:font-semibold">
                {selected.description.split("\n\n").map((para, i) => (
                  <p key={i}>
                    {para.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={j}>{part.slice(2, -2)}</strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                ))}
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9CA89F] mb-1">
                Ideal conditions
              </h3>
              <p className="text-xs text-[#9CA89F] mb-3">
                {chartsLoading ? "Loading…" : "14-day average with standard deviation band (±1 SD) from observation data"}
              </p>
              <div className="space-y-3">
                <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                  <h4 className="text-sm font-medium text-[#F5F5F0] mb-2">Temperature</h4>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA89F" }} />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#9CA89F" }}
                          unit="°C"
                          domain={
                            chartData.length
                              ? [
                                  Math.min(...chartData.map((d) => d.idealTemperatureLower)) - 1,
                                  Math.max(...chartData.map((d) => d.idealTemperatureUpper)) + 1,
                                ]
                              : undefined
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A0E0C",
                            border: "1px solid #2D5F3F",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#F5F5F0" }}
                          formatter={(value: number) =>
                            value != null ? Number(value).toFixed(1) : "—"
                          }
                        />
                        {/* ±1 SD band: baseValue = domain min so fill is from lower to upper line */}
                        {chartData.length > 0 && (() => {
                          const base = Math.min(...chartData.map((d) => d.idealTemperatureLower)) - 1;
                          return (
                            <>
                              <Area
                                type="monotone"
                                dataKey="idealTemperatureUpper"
                                baseValue={base}
                                fill="#4A7C5D"
                                fillOpacity={0.5}
                                stroke="none"
                              />
                              <Area
                                type="monotone"
                                dataKey="idealTemperatureLower"
                                baseValue={base}
                                fill="#0A0E0C"
                                stroke="none"
                              />
                            </>
                          );
                        })()}
                        <Line
                          type="monotone"
                          dataKey="idealTemperature"
                          stroke="#4A7C5D"
                          strokeWidth={2}
                          dot={false}
                          name="Avg °C"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                  <h4 className="text-sm font-medium text-[#F5F5F0] mb-2">Humidity</h4>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA89F" }} />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#9CA89F" }}
                          unit="%"
                          domain={
                            chartData.length
                              ? [
                                  Math.min(...chartData.map((d) => d.idealHumidityLower)) - 2,
                                  Math.max(...chartData.map((d) => d.idealHumidityUpper)) + 2,
                                ]
                              : undefined
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A0E0C",
                            border: "1px solid #2D5F3F",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) =>
                            value != null ? Number(value).toFixed(1) : "—"
                          }
                        />
                        {chartData.length > 0 && (() => {
                          const base = Math.min(...chartData.map((d) => d.idealHumidityLower)) - 2;
                          return (
                            <>
                              <Area
                                type="monotone"
                                dataKey="idealHumidityUpper"
                                baseValue={base}
                                fill="#D4AF37"
                                fillOpacity={0.5}
                                stroke="none"
                              />
                              <Area
                                type="monotone"
                                dataKey="idealHumidityLower"
                                baseValue={base}
                                fill="#0A0E0C"
                                stroke="none"
                              />
                            </>
                          );
                        })()}
                        <Line
                          type="monotone"
                          dataKey="idealHumidity"
                          stroke="#D4AF37"
                          strokeWidth={2}
                          dot={false}
                          name="Avg %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                  <h4 className="text-sm font-medium text-[#F5F5F0] mb-2">Rain</h4>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA89F" }} />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#9CA89F" }}
                          unit=" mm"
                          domain={
                            chartData.length
                              ? [
                                  Math.min(...chartData.map((d) => d.idealRainLower)) - 0.2,
                                  Math.max(...chartData.map((d) => d.idealRainUpper)) + 0.2,
                                ]
                              : undefined
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A0E0C",
                            border: "1px solid #2D5F3F",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) =>
                            value != null ? Number(value).toFixed(1) : "—"
                          }
                        />
                        {chartData.length > 0 && (() => {
                          const base = Math.min(...chartData.map((d) => d.idealRainLower)) - 0.2;
                          return (
                            <>
                              <Area
                                type="monotone"
                                dataKey="idealRainUpper"
                                baseValue={base}
                                fill="#5B8DEF"
                                fillOpacity={0.5}
                                stroke="none"
                              />
                              <Area
                                type="monotone"
                                dataKey="idealRainLower"
                                baseValue={base}
                                fill="#0A0E0C"
                                stroke="none"
                              />
                            </>
                          );
                        })()}
                        <Line
                          type="monotone"
                          dataKey="idealRain"
                          stroke="#5B8DEF"
                          strokeWidth={2}
                          dot={false}
                          name="Avg mm"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {chartData.length > 0 && "idealPressure" in chartData[0] && (
                  <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                    <h4 className="text-sm font-medium text-[#F5F5F0] mb-2">Pressure</h4>
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" />
                          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA89F" }} />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#9CA89F" }}
                            unit=" Pa"
                            domain={
                              chartData.length && "idealPressureLower" in chartData[0]
                                ? [
                                    Math.min(...chartData.map((d) => (d as ClimateDay).idealPressureLower!)) - 500,
                                    Math.max(...chartData.map((d) => (d as ClimateDay).idealPressureUpper!)) + 500,
                                  ]
                                : undefined
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0A0E0C",
                              border: "1px solid #2D5F3F",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) =>
                              value != null ? Number(value).toFixed(0) : "—"
                            }
                          />
                          {chartData.length > 0 && "idealPressureLower" in chartData[0] && (() => {
                            const base = Math.min(...chartData.map((d) => (d as ClimateDay).idealPressureLower!)) - 500;
                            return (
                              <>
                                <Area
                                  type="monotone"
                                  dataKey="idealPressureUpper"
                                  baseValue={base}
                                  fill="#9B59B6"
                                  fillOpacity={0.5}
                                  stroke="none"
                                />
                                <Area
                                  type="monotone"
                                  dataKey="idealPressureLower"
                                  baseValue={base}
                                  fill="#0A0E0C"
                                  stroke="none"
                                />
                              </>
                            );
                          })()}
                          <Line
                            type="monotone"
                            dataKey="idealPressure"
                            stroke="#9B59B6"
                            strokeWidth={2}
                            dot={false}
                            name="Avg Pa"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9CA89F] mb-3">
                Sprouting season
              </h3>
              <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                <p className="text-xs text-[#9CA89F] mb-2">
                  {chartsLoading ? "Loading…" : "Sprouting activity by month from observation dates"}
                </p>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seasonData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA89F" }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#9CA89F" }}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0A0E0C",
                          border: "1px solid #2D5F3F",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#F5F5F0" }}
                        formatter={(value: number) => [`${value}%`, "Activity"]}
                        labelFormatter={(label) => label}
                      />
                      <Bar
                        dataKey="activity"
                        fill="#4A7C5D"
                        radius={[4, 4, 0, 0]}
                        name="Activity"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {elevationBins.length > 0 && (
              <section className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9CA89F] mb-3">
                  Elevation distribution
                </h3>
                <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                  <p className="text-xs text-[#9CA89F] mb-2">
                    Distribution of observations by elevation (m a.s.l.)
                  </p>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={elevationBins.map((b) => ({ name: `${b.bin_start}-${b.bin_end}`, count: b.count }))}
                        margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9CA89F" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#9CA89F" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A0E0C",
                            border: "1px solid #2D5F3F",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [value, "Observations"]}
                        />
                        <Bar dataKey="count" fill="#4A7C5D" radius={[4, 4, 0, 0]} name="Observations" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            {slopeBins.length > 0 && (
              <section className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9CA89F] mb-3">
                  Slope distribution
                </h3>
                <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                  <p className="text-xs text-[#9CA89F] mb-2">
                    Distribution of observations by slope (°)
                  </p>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={slopeBins.map((b) => ({ name: `${b.bin_start.toFixed(1)}–${b.bin_end.toFixed(1)}`, count: b.count }))}
                        margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9CA89F" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#9CA89F" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A0E0C",
                            border: "1px solid #2D5F3F",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [value, "Observations"]}
                        />
                        <Bar dataKey="count" fill="#4A7C5D" radius={[4, 4, 0, 0]} name="Observations" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            {aspectBins.length > 0 && (
              <section className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9CA89F] mb-3">
                  Aspect distribution
                </h3>
                <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                  <p className="text-xs text-[#9CA89F] mb-2">
                    Distribution of observations by aspect (0–360°)
                  </p>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={aspectBins.map((b) => ({ name: `${b.bin_start}–${b.bin_end}`, count: b.count }))}
                        margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9CA89F" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#9CA89F" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A0E0C",
                            border: "1px solid #2D5F3F",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [value, "Observations"]}
                        />
                        <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} name="Observations" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            {geomorphonCategories.length > 0 && (
              <section className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9CA89F] mb-3">
                  Geomorphon (terrain form)
                </h3>
                <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                  <p className="text-xs text-[#9CA89F] mb-2">
                    Distribution of observations by terrain form
                  </p>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={geomorphonCategories}
                        margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA89F" }} />
                        <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#9CA89F" }} width={70} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A0E0C",
                            border: "1px solid #2D5F3F",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [value, "Observations"]}
                        />
                        <Bar dataKey="count" fill="#5B8DEF" radius={[0, 4, 4, 0]} name="Observations" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            {landcoverCategories.length > 0 && (
              <section className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9CA89F] mb-3">
                  Land cover
                </h3>
                <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                  <p className="text-xs text-[#9CA89F] mb-2">
                    Distribution of observations by land cover code (CORINE)
                  </p>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={landcoverCategories.map((c) => ({ label: `LC ${c.code}`, count: c.count }))}
                        margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA89F" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#9CA89F" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A0E0C",
                            border: "1px solid #2D5F3F",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [value, "Observations"]}
                        />
                        <Bar dataKey="count" fill="#9B59B6" radius={[4, 4, 0, 0]} name="Observations" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9CA89F] mb-3">
                Statistics
              </h3>
              <dl className="grid gap-2 sm:grid-cols-2">
                {selected.statistics.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2 border-b border-[#2D5F3F]/20 last:border-0"
                  >
                    <dt className="text-[#9CA89F] text-sm shrink-0 sm:w-32">
                      {stat.label}
                    </dt>
                    <dd className="text-[#F5F5F0] font-medium">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}

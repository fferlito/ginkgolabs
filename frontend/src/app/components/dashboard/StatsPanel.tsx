import React, { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { subDays, format } from "date-fns";
import { X } from "lucide-react";

const DAYS = 14;

function getApiBase(): string {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  const url = (env?.VITE_API_URL?.trim() || env?.VITE_MUSHROOM_API_BASE?.trim()) || "";
  if (url) return url;
  const isProduction = typeof window !== "undefined" && window.location?.hostname !== "localhost" && !window.location?.hostname?.startsWith("127.");
  return isProduction ? "https://backend-production-bc08.up.railway.app" : "http://localhost:8000";
}

function getApiKey(): string {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return (env?.VITE_API_KEY?.trim() ?? env?.VITE_MUSHROOM_API_KEY?.trim() ?? "") || "";
}

async function apiGet<T>(url: string): Promise<T | null> {
  const headers: Record<string, string> = { "Cache-Control": "no-cache", Pragma: "no-cache" };
  if (getApiKey()) headers["X-API-Key"] = getApiKey();
  const res = await fetch(url, { headers });
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("text/html") || !res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type ClimateDay = {
  day: string;
  idealTemperature: number;
  idealHumidity: number;
  idealRain: number;
};

// Ideal trend fallback when no API data
function idealTrend(base: number, amplitude: number, days: number) {
  return (i: number) =>
    base + amplitude * Math.sin((i / (days - 1)) * Math.PI * 0.8);
}

// Base chart data: 14 days with date labels; actual (fake) + ideal from API or fallback
function useBaseChartData() {
  return useMemo(() => {
    const idealT = idealTrend(15, 2, DAYS);
    const idealH = idealTrend(80, 5, DAYS);
    const idealR = idealTrend(3, 0.8, DAYS);
    return Array.from({ length: DAYS }, (_, i) => {
      const d = subDays(new Date(), DAYS - 1 - i);
      return {
        date: format(d, "MMM d"),
        temperature: 12 + Math.sin(i * 0.5) * 6 + (Math.random() - 0.5) * 4,
        humidity: 65 + Math.sin(i * 0.3) * 15 + (Math.random() - 0.5) * 10,
        rain: Math.max(0, (Math.random() - 0.6) * 8),
        idealTemperature: idealT(i),
        idealHumidity: idealH(i),
        idealRain: Math.max(0, idealR(i)),
      };
    });
  }, []);
}

// Fake stats for the selected point
const FAKE_STATS = {
  forestType: "Pine",
  elevation: "412 m",
  slope: "12°",
  aspect: "SW (225°)",
};

interface StatsPanelProps {
  open: boolean;
  onClose: () => void;
  point: { lat: number; lng: number; prediction: number } | null;
  /** API mushroom id (e.g. "porcini") to fetch ideal climate from backend. */
  mushroomId: string | null;
}

export function StatsPanel({ open, onClose, point, mushroomId }: StatsPanelProps) {
  const baseData = useBaseChartData();
  const [idealFromApi, setIdealFromApi] = useState<ClimateDay[] | null>(null);

  useEffect(() => {
    if (!open || !mushroomId) {
      setIdealFromApi(null);
      return;
    }
    const apiBase = getApiBase();
    apiGet<{ days: ClimateDay[] }>(`${apiBase}/api/mushrooms/${mushroomId}/climate`).then((res) => {
      if (res?.days?.length === DAYS) setIdealFromApi(res.days);
      else setIdealFromApi(null);
    });
  }, [open, mushroomId]);

  const data = useMemo(() => {
    return baseData.map((row, i) => {
      if (idealFromApi && idealFromApi[i]) {
        return {
          ...row,
          idealTemperature: idealFromApi[i].idealTemperature,
          idealHumidity: idealFromApi[i].idealHumidity,
          idealRain: idealFromApi[i].idealRain,
        };
      }
      return row;
    });
  }, [baseData, idealFromApi]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop - click to close */}
      <button
        type="button"
        className="fixed inset-0 z-[1000] bg-black/20 transition-opacity cursor-default"
        aria-label="Close panel"
        onClick={onClose}
      />

      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-full min-w-0 sm:max-w-[33.333%] sm:min-w-[280px] z-[1001] bg-[#0A0E0C] border-l border-[#2D5F3F]/30 shadow-2xl flex flex-col transition-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right duration-300"
        data-state="open"
        role="dialog"
        aria-label="Location statistics"
      >
        <div className="flex items-center justify-between border-b border-[#2D5F3F]/30 px-4 py-2">
          <h2 className="text-base font-semibold text-[#F5F5F0]">Location stats</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA89F] hover:text-[#F5F5F0] hover:bg-[#1B3022] transition-colors"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
              <p className="text-xs text-[#9CA89F] uppercase tracking-wider mb-0.5">
                Forest type
              </p>
              <p className="text-[#F5F5F0] font-semibold text-sm">{FAKE_STATS.forestType}</p>
            </div>
            <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
              <p className="text-xs text-[#9CA89F] uppercase tracking-wider mb-0.5">
                Elevation
              </p>
              <p className="text-[#F5F5F0] font-semibold text-sm">{FAKE_STATS.elevation}</p>
            </div>
            <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
              <p className="text-xs text-[#9CA89F] uppercase tracking-wider mb-0.5">
                Slope
              </p>
              <p className="text-[#F5F5F0] font-semibold text-sm">{FAKE_STATS.slope}</p>
            </div>
            <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
              <p className="text-xs text-[#9CA89F] uppercase tracking-wider mb-0.5">
                Aspect
              </p>
              <p className="text-[#F5F5F0] font-semibold text-sm">{FAKE_STATS.aspect}</p>
            </div>
          </div>

          {/* Temperature */}
          <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-3">
            <h3 className="text-sm font-medium text-[#F5F5F0] mb-2">
              Temperature
            </h3>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#9CA89F" }}
                    stroke="#2D5F3F/30"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9CA89F" }}
                    stroke="#2D5F3F/30"
                    unit="°C"
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
                  <Line
                    type="monotone"
                    dataKey="idealTemperature"
                    stroke="#4A7C5D"
                    strokeWidth={2}
                    strokeOpacity={0.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Ideal"
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#4A7C5D"
                    strokeWidth={2}
                    dot={false}
                    name="°C"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Humidity */}
          <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-3">
            <h3 className="text-sm font-medium text-[#F5F5F0] mb-2">
              Humidity
            </h3>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#9CA89F" }}
                    stroke="#2D5F3F/30"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9CA89F" }}
                    stroke="#2D5F3F/30"
                    unit="%"
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
                  <Line
                    type="monotone"
                    dataKey="idealHumidity"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    strokeOpacity={0.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Ideal"
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    dot={false}
                    name="%"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rain */}
          <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-3">
            <h3 className="text-sm font-medium text-[#F5F5F0] mb-2">
              Rain
            </h3>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#9CA89F" }}
                    stroke="#2D5F3F/30"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9CA89F" }}
                    stroke="#2D5F3F/30"
                    unit=" mm"
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
                  <Line
                    type="monotone"
                    dataKey="idealRain"
                    stroke="#5B8DEF"
                    strokeWidth={2}
                    strokeOpacity={0.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Ideal"
                  />
                  <Line
                    type="monotone"
                    dataKey="rain"
                    stroke="#5B8DEF"
                    strokeWidth={2}
                    dot={false}
                    name="mm"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {point && (
            <p className="text-xs text-[#9CA89F] pt-1">
              Point: {point.lat.toFixed(4)}, {point.lng.toFixed(4)} · Probability:{(point.prediction * 100).toFixed(1)}%
            </p>
          )}
        </div>
      </div>
    </>
  );
}

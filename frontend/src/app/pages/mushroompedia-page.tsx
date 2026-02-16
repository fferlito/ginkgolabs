import { useState, useMemo } from "react";
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

/** Sprouting activity by month (0–100), peak around October (index 9). */
function useSeasonData(mushroomId: string) {
  return useMemo(() => {
    const peakMonth = 9; // October
    const sigma = 5;
    return MONTHS.map((month, i) => ({
      month,
      activity: Math.round(100 * Math.exp(-Math.pow(i - peakMonth, 2) / sigma)),
    }));
  }, [mushroomId]);
}

function idealTrend(base: number, amplitude: number, days: number) {
  return (i: number) =>
    base + amplitude * Math.sin((i / (days - 1)) * Math.PI * 0.8);
}

const DAYS = 14;
const TEMP_SD = 1.5;
const HUMIDITY_SD = 8;
const RAIN_SD = 0.5;

/** 14-day generic sequence: ideal average ± 1 SD band (no calendar dates). */
function useChartData(mushroomId: string) {
  return useMemo(() => {
    const idealT = idealTrend(15, 2, DAYS);
    const idealH = idealTrend(80, 5, DAYS);
    const idealR = idealTrend(3, 0.8, DAYS);
    return Array.from({ length: DAYS }, (_, i) => {
      const t = idealT(i);
      const h = idealH(i);
      const r = Math.max(0, idealR(i));
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
  }, [mushroomId]);
}

type MushroomEntry = {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  statistics: { label: string; value: string }[];
};

const MUSHROOMS: MushroomEntry[] = [
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
  const [selectedId, setSelectedId] = useState<string>(MUSHROOMS[0].id);
  const selected = MUSHROOMS.find((m) => m.id === selectedId) ?? MUSHROOMS[0];
  const chartData = useChartData(selectedId);
  const seasonData = useSeasonData(selectedId);

  return (
    <div className="min-h-screen bg-[#0A0E0C]">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F0] mb-6">
          Mushroompedia
        </h1>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Left sidebar: mushroom names */}
          <aside className="w-full md:w-56 shrink-0">
            <nav
              className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-2"
              aria-label="Mushroom list"
            >
              <ul className="space-y-0.5">
                {MUSHROOMS.map((m) => (
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

          {/* Main content: markdown-style entry */}
          <article className="flex-1 min-w-0 rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6 sm:p-8 text-[#F5F5F0]">
            <header className="border-b border-[#2D5F3F]/30 pb-4 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#F5F5F0]">
                {selected.name}
              </h2>
              <p className="text-[#4A7C5D] italic mt-1">{selected.scientificName}</p>
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
                14-day average with standard deviation band (±1 SD)
              </p>
              <div className="space-y-3">
                <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                  <h4 className="text-sm font-medium text-[#F5F5F0] mb-2">Temperature</h4>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,95,63,0.2)" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA89F" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#9CA89F" }} unit="°C" />
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
                        <Area
                          type="monotone"
                          dataKey="idealTemperatureUpper"
                          fill="#4A7C5D"
                          fillOpacity={0.25}
                          stroke="none"
                        />
                        <Area
                          type="monotone"
                          dataKey="idealTemperatureLower"
                          fill="#0A0E0C"
                          stroke="none"
                        />
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
                        <YAxis tick={{ fontSize: 10, fill: "#9CA89F" }} unit="%" />
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
                        <Area
                          type="monotone"
                          dataKey="idealHumidityUpper"
                          fill="#D4AF37"
                          fillOpacity={0.25}
                          stroke="none"
                        />
                        <Area
                          type="monotone"
                          dataKey="idealHumidityLower"
                          fill="#0A0E0C"
                          stroke="none"
                        />
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
                        <YAxis tick={{ fontSize: 10, fill: "#9CA89F" }} unit=" mm" />
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
                        <Area
                          type="monotone"
                          dataKey="idealRainUpper"
                          fill="#5B8DEF"
                          fillOpacity={0.25}
                          stroke="none"
                        />
                        <Area
                          type="monotone"
                          dataKey="idealRainLower"
                          fill="#0A0E0C"
                          stroke="none"
                        />
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
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9CA89F] mb-3">
                Sprouting season
              </h3>
              <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
                <p className="text-xs text-[#9CA89F] mb-2">
                  Typical sprouting activity over the year (peak around October)
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

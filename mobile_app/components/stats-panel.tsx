import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line, Polyline, Text as SvgText } from "react-native-svg";
import { X } from "lucide-react-native";

const DAYS = 14;
const PRODUCTION_API = "https://backend-production-bc08.up.railway.app";

function getApiBase(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return PRODUCTION_API;
}

function getApiKey(): string {
  return process.env.EXPO_PUBLIC_API_KEY?.trim() ?? "";
}

async function apiGet<T>(path: string): Promise<T | null> {
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

function formatMd(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function subDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() - n);
  return next;
}

function idealTrend(base: number, amplitude: number, days: number) {
  return (i: number) =>
    base + amplitude * Math.sin((i / (days - 1)) * Math.PI * 0.8);
}

type ChartRow = {
  date: string;
  temperature: number;
  humidity: number;
  rain: number;
  idealTemperature: number;
  idealHumidity: number;
  idealRain: number;
};

type ClimateDay = {
  day: string;
  idealTemperature: number;
  idealHumidity: number;
  idealRain: number;
};

function buildBaseChartData(): ChartRow[] {
  const idealT = idealTrend(15, 2, DAYS);
  const idealH = idealTrend(80, 5, DAYS);
  const idealR = idealTrend(3, 0.8, DAYS);
  return Array.from({ length: DAYS }, (_, i) => {
    const d = subDays(new Date(), DAYS - 1 - i);
    return {
      date: formatMd(d),
      temperature: 12 + Math.sin(i * 0.5) * 6 + (Math.random() - 0.5) * 4,
      humidity: 65 + Math.sin(i * 0.3) * 15 + (Math.random() - 0.5) * 10,
      rain: Math.max(0, (Math.random() - 0.6) * 8),
      idealTemperature: idealT(i),
      idealHumidity: idealH(i),
      idealRain: Math.max(0, idealR(i)),
    };
  });
}

const FAKE_STATS = {
  forestType: "Pine",
  elevation: "412 m",
  slope: "12°",
  aspect: "SW (225°)",
};

function DualLineChart({
  labels,
  actual,
  ideal,
  color,
  unit,
}: {
  labels: string[];
  actual: number[];
  ideal: number[];
  color: string;
  unit: string;
}) {
  const [width, setWidth] = useState(0);
  const height = 120;
  const padL = 36;
  const padR = 8;
  const padT = 8;
  const padB = 20;

  const all = [...actual, ...ideal];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const innerW = Math.max(1, width - padL - padR);
  const innerH = height - padT - padB;

  const toPoints = (values: number[]) =>
    values
      .map((v, i) => {
        const x = padL + (i / Math.max(1, values.length - 1)) * innerW;
        const y = padT + innerH - ((v - min) / range) * innerH;
        return `${x},${y}`;
      })
      .join(" ");

  const yTicks = [max, (max + min) / 2, min];
  const xIdx = [0, Math.floor((labels.length - 1) / 2), labels.length - 1];

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {yTicks.map((_, i) => {
            const y = padT + (i / 2) * innerH;
            return (
              <Line
                key={`g-${i}`}
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="rgba(45,95,63,0.35)"
                strokeDasharray="3 3"
              />
            );
          })}
          <Polyline
            points={toPoints(ideal)}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeOpacity={0.5}
            strokeDasharray="4 4"
          />
          <Polyline
            points={toPoints(actual)}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
          {yTicks.map((t, i) => (
            <SvgText
              key={`y-${i}`}
              x={0}
              y={padT + (i / 2) * innerH + 3}
              fill="#9CA89F"
              fontSize={10}
            >
              {`${t.toFixed(0)}${unit}`}
            </SvgText>
          ))}
          {xIdx.map((i) => {
            const x = padL + (i / Math.max(1, labels.length - 1)) * innerW;
            return (
              <SvgText
                key={`x-${i}`}
                x={x}
                y={height - 4}
                fill="#9CA89F"
                fontSize={10}
                textAnchor="middle"
              >
                {labels[i]}
              </SvgText>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
      <Text className="mb-0.5 text-xs uppercase tracking-wider text-[#9CA89F]">{label}</Text>
      <Text className="text-sm font-semibold text-[#F5F5F0]">{value}</Text>
    </View>
  );
}

function ChartBlock({
  title,
  labels,
  actual,
  ideal,
  color,
  unit,
}: {
  title: string;
  labels: string[];
  actual: number[];
  ideal: number[];
  color: string;
  unit: string;
}) {
  return (
    <View className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-3">
      <Text className="mb-1 text-sm font-medium text-[#F5F5F0]">{title}</Text>
      <View className="mb-1 flex-row gap-3">
        <Text className="text-[10px] text-[#9CA89F]">— Actual</Text>
        <Text className="text-[10px] text-[#9CA89F]">- - Ideal</Text>
      </View>
      <DualLineChart
        labels={labels}
        actual={actual}
        ideal={ideal}
        color={color}
        unit={unit}
      />
    </View>
  );
}

export function StatsPanel({
  open,
  onClose,
  point,
  mushroomId,
}: {
  open: boolean;
  onClose: () => void;
  point: { lat: number; lng: number; prediction: number } | null;
  mushroomId: string | null;
}) {
  const insets = useSafeAreaInsets();
  const baseData = useMemo(() => buildBaseChartData(), []);
  const [idealFromApi, setIdealFromApi] = useState<ClimateDay[] | null>(null);

  useEffect(() => {
    if (!open || !mushroomId) {
      setIdealFromApi(null);
      return;
    }
    apiGet<{ days: ClimateDay[] }>(`/api/mushrooms/${mushroomId}/climate`).then((res) => {
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

  const labels = data.map((row) => row.date);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#0A0E0C]" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between border-b border-[#2D5F3F]/30 px-4 py-2">
          <Text className="text-base font-semibold text-[#F5F5F0]">Location stats</Text>
          <Pressable
            onPress={onClose}
            className="rounded-lg p-1.5"
            accessibilityLabel="Close panel"
          >
            <X color="#9CA89F" size={20} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 12,
            gap: 12,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View className="flex-row gap-2">
            <StatCard label="Forest type" value={FAKE_STATS.forestType} />
            <StatCard label="Elevation" value={FAKE_STATS.elevation} />
          </View>
          <View className="flex-row gap-2">
            <StatCard label="Slope" value={FAKE_STATS.slope} />
            <StatCard label="Aspect" value={FAKE_STATS.aspect} />
          </View>

          <ChartBlock
            title="Temperature"
            labels={labels}
            actual={data.map((r) => r.temperature)}
            ideal={data.map((r) => r.idealTemperature)}
            color="#4A7C5D"
            unit="°C"
          />
          <ChartBlock
            title="Humidity"
            labels={labels}
            actual={data.map((r) => r.humidity)}
            ideal={data.map((r) => r.idealHumidity)}
            color="#D4AF37"
            unit="%"
          />
          <ChartBlock
            title="Rain"
            labels={labels}
            actual={data.map((r) => r.rain)}
            ideal={data.map((r) => r.idealRain)}
            color="#5B8DEF"
            unit=" mm"
          />

          {point ? (
            <Text className="pt-1 text-xs text-[#9CA89F]">
              Point: {point.lat.toFixed(4)}, {point.lng.toFixed(4)} · Probability:{" "}
              {(point.prediction * 100).toFixed(1)}%
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

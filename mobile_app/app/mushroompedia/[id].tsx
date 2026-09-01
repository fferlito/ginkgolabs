import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Subpage } from "../../components/subpage";
import {
  BarChart,
  ChartCard,
  HBarChart,
  LineChart,
  RadarChart,
} from "../../components/charts";
import {
  apiGet,
  relativeValues,
  type Bin,
  type ClimateDay,
  type MushroomEntry,
} from "../../lib/api";

const ASPECT_COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

function aspectBinsToRadarData(bins: Bin[]): { subject: string; value: number }[] {
  const bySector = new Array(8).fill(0);
  const rel = relativeValues(bins);
  bins.forEach((b, i) => {
    const center = (b.bin_start + b.bin_end) / 2;
    const angle = ((center % 360) + 360) % 360;
    const index = Math.round(angle / 45) % 8;
    if (rel[i] > bySector[index]) bySector[index] = rel[i];
  });
  return ASPECT_COMPASS.map((subject, i) => ({
    subject,
    value: Math.round(bySector[i] * 10) / 10,
  }));
}

function Description({ text }: { text: string }) {
  return (
    <View className="mb-6">
      <Text className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#9CA89F]">
        Description
      </Text>
      {text.split("\n\n").map((para, i) => (
        <Text key={i} className="mb-2 leading-relaxed text-[#F5F5F0]/90">
          {para.split(/(\*\*.*?\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <Text key={j} className="font-semibold text-[#F5F5F0]">
                {part.slice(2, -2)}
              </Text>
            ) : (
              part
            )
          )}
        </Text>
      ))}
    </View>
  );
}

export default function MushroompediaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const selectedId = Array.isArray(id) ? id[0] : id;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const [detail, setDetail] = useState<MushroomEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [chartData, setChartData] = useState<ClimateDay[]>([]);
  const [seasonData, setSeasonData] = useState<{ month: string; activity: number }[]>([]);
  const [elevationBins, setElevationBins] = useState<Bin[]>([]);
  const [slopeBins, setSlopeBins] = useState<Bin[]>([]);
  const [aspectBins, setAspectBins] = useState<Bin[]>([]);
  const [geomorphon, setGeomorphon] = useState<{ label: string; value: number }[]>([]);
  const [landcover, setLandcover] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    if (!selectedId) return;
    setDetailLoading(true);
    apiGet<MushroomEntry>(`/api/mushrooms/${selectedId}`)
      .then((data) => {
        if (data && data.id === selectedId) setDetail(data);
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const current = selectedId;
    setChartsLoading(true);
    type ClimateRes = { days: ClimateDay[] };
    type SeasonRes = { months: { month: string; activity: number }[] };
    type BinsRes = { bins: Bin[] };
    type GeoRes = { categories: { label: string; value?: number; count?: number }[] };
    type LcRes = { categories: { code: number; value?: number; count?: number }[] };

    Promise.all([
      apiGet<ClimateRes>(`/api/mushrooms/${current}/climate`),
      apiGet<SeasonRes>(`/api/mushrooms/${current}/season`),
      apiGet<BinsRes>(`/api/mushrooms/${current}/elevation`),
      apiGet<BinsRes>(`/api/mushrooms/${current}/slope`),
      apiGet<BinsRes>(`/api/mushrooms/${current}/aspect`),
      apiGet<GeoRes>(`/api/mushrooms/${current}/geomorphon`),
      apiGet<LcRes>(`/api/mushrooms/${current}/landcover`),
    ])
      .then(([climate, season, elevation, slope, aspect, geo, lc]) => {
        if (current !== selectedIdRef.current) return;
        setChartData(climate?.days?.length ? climate.days : []);
        setSeasonData(season?.months?.length ? season.months : []);
        setElevationBins(elevation?.bins?.length ? elevation.bins : []);
        setSlopeBins(slope?.bins?.length ? slope.bins : []);
        setAspectBins(aspect?.bins?.length ? aspect.bins : []);
        const geoCats = geo?.categories ?? [];
        const geoNums = geoCats.map((c) => c.value ?? c.count ?? 0);
        const geoMax = Math.max(...geoNums, 1);
        setGeomorphon(
          geoCats.map((c, i) => ({ label: c.label, value: (geoNums[i] / geoMax) * 100 }))
        );
        const lcCats = lc?.categories ?? [];
        const lcNums = lcCats.map((c) => c.value ?? c.count ?? 0);
        const lcMax = Math.max(...lcNums, 1);
        setLandcover(
          lcCats.map((c, i) => ({
            label: `LC ${c.code}`,
            value: (lcNums[i] / lcMax) * 100,
          }))
        );
      })
      .finally(() => {
        if (current === selectedIdRef.current) setChartsLoading(false);
      });
  }, [selectedId]);

  const title = detail?.name ?? "Mushroompedia";
  const climateLabels = chartData.map((d) => d.day.replace("Day ", "D"));

  return (
    <Subpage title={title}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {detailLoading && !detail ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#4A7C5D" />
          </View>
        ) : null}

        {detail ? (
          <>
            <View className="mb-4 border-b border-[#2D5F3F]/30 pb-4">
              <Text className="text-xl font-semibold text-[#F5F5F0]">{detail.name}</Text>
              <Text className="mt-1 italic text-[#4A7C5D]">{detail.scientificName}</Text>
            </View>
            <Description text={detail.description} />
          </>
        ) : null}

        {chartsLoading ? (
          <View className="mb-6 min-h-[180px] items-center justify-center rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-8">
            <ActivityIndicator color="#4A7C5D" size="large" />
            <Text className="mt-3 text-sm text-[#9CA89F]">Loading charts and data…</Text>
          </View>
        ) : (
          <>
            {chartData.length > 0 ? (
              <View className="mb-2">
                <Text className="mb-1 text-sm font-semibold uppercase tracking-wider text-[#9CA89F]">
                  Ideal conditions
                </Text>
                <Text className="mb-3 text-xs text-[#9CA89F]">
                  14-day average from observation data
                </Text>
                <ChartCard title="Temperature">
                  <LineChart
                    values={chartData.map((d) => d.idealTemperature)}
                    labels={climateLabels}
                    color="#4A7C5D"
                    unit="°C"
                  />
                </ChartCard>
                <ChartCard title="Humidity">
                  <LineChart
                    values={chartData.map((d) => d.idealHumidity)}
                    labels={climateLabels}
                    color="#D4AF37"
                    unit="%"
                  />
                </ChartCard>
                <ChartCard title="Rain">
                  <LineChart
                    values={chartData.map((d) => d.idealRain)}
                    labels={climateLabels}
                    color="#5B8DEF"
                    unit=" mm"
                  />
                </ChartCard>
                {chartData[0]?.idealPressure != null ? (
                  <ChartCard title="Pressure">
                    <LineChart
                      values={chartData.map((d) => d.idealPressure ?? 0)}
                      labels={climateLabels}
                      color="#9B59B6"
                      unit=" Pa"
                    />
                  </ChartCard>
                ) : null}
              </View>
            ) : null}

            {seasonData.length > 0 ? (
              <ChartCard
                title="Sprouting season"
                caption="Sprouting activity by month from observation dates"
              >
                <BarChart
                  values={seasonData.map((d) => d.activity)}
                  labels={seasonData.map((d) => d.month)}
                  color="#4A7C5D"
                />
              </ChartCard>
            ) : null}

            {elevationBins.length > 0 ? (
              <ChartCard
                title="Elevation distribution"
                caption="Relative scale 0–100% by elevation (m a.s.l.)"
              >
                <BarChart
                  values={relativeValues(elevationBins)}
                  labels={elevationBins.map((b) => `${b.bin_start}`)}
                  color="#2E8B7E"
                />
              </ChartCard>
            ) : null}

            {slopeBins.length > 0 ? (
              <ChartCard
                title="Slope distribution"
                caption="Relative scale 0–100% by slope (°)"
              >
                <BarChart
                  values={relativeValues(slopeBins)}
                  labels={slopeBins.map((b) => `${b.bin_start}`)}
                  color="#4A7C5D"
                />
              </ChartCard>
            ) : null}

            {aspectBins.length > 0 ? (
              <ChartCard
                title="Aspect distribution"
                caption="Compass direction (N at top, 0–100% relative)"
              >
                <RadarChart items={aspectBinsToRadarData(aspectBins)} color="#D4AF37" />
              </ChartCard>
            ) : null}

            {geomorphon.length > 0 ? (
              <ChartCard
                title="Geomorphon (terrain form)"
                caption="Relative frequency by terrain form (0–100%)"
              >
                <HBarChart items={geomorphon} color="#5B8DEF" />
              </ChartCard>
            ) : null}

            {landcover.length > 0 ? (
              <ChartCard
                title="Land cover"
                caption="Relative frequency by land cover code (CORINE)"
              >
                <BarChart
                  values={landcover.map((c) => c.value)}
                  labels={landcover.map((c) => c.label)}
                  color="#9B59B6"
                />
              </ChartCard>
            ) : null}
          </>
        )}

        {detail?.statistics?.length ? (
          <View className="mt-2">
            <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#9CA89F]">
              Statistics
            </Text>
            {detail.statistics.map((stat) => (
              <View
                key={stat.label}
                className="flex-row justify-between border-b border-[#2D5F3F]/20 py-2"
              >
                <Text className="text-sm text-[#9CA89F]">{stat.label}</Text>
                <Text className="ml-4 flex-1 text-right font-medium text-[#F5F5F0]">
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Subpage>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Leaf } from "lucide-react-native";
import { Subpage } from "../../components/subpage";
import { mushroomCommonName } from "../../lib/i18n";
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
  type MushroomPhoto,
} from "../../lib/api";
import { bundledPediaById, resolvePediaDetail } from "../../lib/pedia-catalog";

const ASPECT_COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
const MONTH_KEYS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

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
  const { t } = useTranslation();
  if (!text.trim()) return null;
  return (
    <View className="mb-6">
      <Text className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#9CA89F]">
        {t("pedia.description")}
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
            ),
          )}
        </Text>
      ))}
    </View>
  );
}

function PhotoPager({ photos }: { photos: MushroomPhoto[] }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(width - 32, 280);
  const [page, setPage] = useState(0);
  const photo = photos[page];

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setPage(Math.max(0, Math.min(photos.length - 1, next)));
  }

  if (photos.length === 0) {
    return (
      <View className="mb-4 h-56 items-center justify-center rounded-xl bg-[#1B3022]">
        <Leaf color="#4A7C5D" size={36} />
      </View>
    );
  }

  return (
    <View className="mb-4">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {photos.map((item, index) => (
          <View
            key={`${item.url}-${index}`}
            style={{ width: cardWidth, height: 224, borderRadius: 12, overflow: "hidden", backgroundColor: "#0A0E0C" }}
          >
            <Image
              source={{ uri: item.url }}
              style={{ width: cardWidth, height: 224 }}
              resizeMode="contain"
            />
          </View>
        ))}
      </ScrollView>
      {photos.length > 1 ? (
        <View className="mt-2 flex-row items-center justify-center gap-1.5">
          {photos.map((item, index) => (
            <View
              key={`${item.url}-dot-${index}`}
              style={{
                width: index === page ? 8 : 6,
                height: index === page ? 8 : 6,
                borderRadius: 4,
                backgroundColor: index === page ? "#F5F5F0" : "rgba(245,245,240,0.35)",
              }}
            />
          ))}
        </View>
      ) : null}
      {photo?.credit ? (
        <Text className="mt-2 text-xs text-[#9CA89F]">
          {t("pedia.photoCredit", { credit: photo.credit })}
          {photo.license ? ` · ${photo.license}` : ""}
        </Text>
      ) : null}
    </View>
  );
}

function settledArray<T>(result: PromiseSettledResult<T | null | undefined>): T | null {
  if (result.status !== "fulfilled" || !result.value) return null;
  return result.value;
}

export default function MushroompediaDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const selectedId = Array.isArray(id) ? id[0] : id;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const [detail, setDetail] = useState<MushroomEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartData, setChartData] = useState<ClimateDay[]>([]);
  const [seasonData, setSeasonData] = useState<{ month: string; activity: number }[]>([]);
  const [elevationBins, setElevationBins] = useState<Bin[]>([]);
  const [slopeBins, setSlopeBins] = useState<Bin[]>([]);
  const [aspectBins, setAspectBins] = useState<Bin[]>([]);
  const [geomorphon, setGeomorphon] = useState<{ label: string; value: number }[]>([]);
  const [landcover, setLandcover] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    if (!selectedId) return;
    const local = bundledPediaById(selectedId) ?? null;
    if (local) {
      setDetail(local);
      setDetailLoading(false);
    } else {
      setDetailLoading(true);
    }
    apiGet<MushroomEntry>(`/api/mushrooms/${selectedId}`)
      .then((data) => {
        if (data && data.id === selectedId) {
          setDetail(resolvePediaDetail(selectedId, data));
        } else if (!local) {
          setDetail(null);
        }
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !detail?.hasStats) {
      setChartsLoading(false);
      setChartData([]);
      setSeasonData([]);
      setElevationBins([]);
      setSlopeBins([]);
      setAspectBins([]);
      setGeomorphon([]);
      setLandcover([]);
      return;
    }
    const current = selectedId;
    setChartsLoading(true);
    type ClimateRes = { days: ClimateDay[] };
    type SeasonRes = { months: { month: string; activity: number }[] };
    type BinsRes = { bins: Bin[] };
    type GeoRes = { categories: { label: string; value?: number; count?: number }[] };
    type LcRes = { categories: { code: number; value?: number; count?: number }[] };

    Promise.allSettled([
      apiGet<ClimateRes>(`/api/mushrooms/${current}/climate`),
      apiGet<SeasonRes>(`/api/mushrooms/${current}/season`),
      apiGet<BinsRes>(`/api/mushrooms/${current}/elevation`),
      apiGet<BinsRes>(`/api/mushrooms/${current}/slope`),
      apiGet<BinsRes>(`/api/mushrooms/${current}/aspect`),
      apiGet<GeoRes>(`/api/mushrooms/${current}/geomorphon`),
      apiGet<LcRes>(`/api/mushrooms/${current}/landcover`),
    ]).then((results) => {
      if (current !== selectedIdRef.current) return;
      const climate = settledArray(results[0]);
      const season = settledArray(results[1]);
      const elevation = settledArray(results[2]);
      const slope = settledArray(results[3]);
      const aspect = settledArray(results[4]);
      const geo = settledArray(results[5]);
      const lc = settledArray(results[6]);
      setChartData(climate?.days?.length ? climate.days : []);
      setSeasonData(season?.months?.length ? season.months : []);
      setElevationBins(elevation?.bins?.length ? elevation.bins : []);
      setSlopeBins(slope?.bins?.length ? slope.bins : []);
      setAspectBins(aspect?.bins?.length ? aspect.bins : []);
      const geoCats = geo?.categories ?? [];
      const geoNums = geoCats.map((c) => c.value ?? c.count ?? 0);
      const geoMax = Math.max(...geoNums, 1);
      setGeomorphon(geoCats.map((c, i) => ({ label: c.label, value: (geoNums[i] / geoMax) * 100 })));
      const lcCats = lc?.categories ?? [];
      const lcNums = lcCats.map((c) => c.value ?? c.count ?? 0);
      const lcMax = Math.max(...lcNums, 1);
      setLandcover(lcCats.map((c, i) => ({ label: `LC ${c.code}`, value: (lcNums[i] / lcMax) * 100 })));
    }).finally(() => {
      if (current === selectedIdRef.current) setChartsLoading(false);
    });
  }, [selectedId, detail?.hasStats]);

  const title = detail ? mushroomCommonName(detail) : t("pedia.title");
  const climateLabels = chartData.map((d) => d.day.replace("Day ", "D"));
  const seasonLabel = useMemo(() => {
    const months = detail?.seasonMonths ?? [];
    return months.filter((m) => m >= 1 && m <= 12).map((m) => MONTH_KEYS[m - 1]).join(", ");
  }, [detail?.seasonMonths]);
  const edibilityLabel = detail?.poisonous
    ? t("pedia.poisonous")
    : detail?.edible
      ? t("pedia.edible")
      : t("pedia.notEdible");

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
            <PhotoPager photos={detail.photos ?? []} />
            <View className="mb-4 border-b border-[#2D5F3F]/30 pb-4">
              <Text className="text-xl font-semibold text-[#F5F5F0]">{mushroomCommonName(detail)}</Text>
              <Text className="mt-1 italic text-[#4A7C5D]">{detail.scientificName}</Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                <View className="rounded-full border border-[#2D5F3F] px-3 py-1">
                  <Text className="text-xs font-medium text-[#F5F5F0]">{edibilityLabel}</Text>
                </View>
                {seasonLabel ? (
                  <View className="rounded-full border border-[#2D5F3F] px-3 py-1">
                    <Text className="text-xs font-medium text-[#F5F5F0]">{seasonLabel}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Description text={detail.description ?? ""} />
          </>
        ) : null}

        {detail?.hasStats && chartsLoading ? (
          <View className="mb-6 min-h-[180px] items-center justify-center rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-8">
            <ActivityIndicator color="#4A7C5D" size="large" />
            <Text className="mt-3 text-sm text-[#9CA89F]">{t("pedia.loadingCharts")}</Text>
          </View>
        ) : null}

        {detail?.hasStats && !chartsLoading ? (
          <>
            {chartData.length > 0 ? (
              <View className="mb-2">
                <Text className="mb-1 text-sm font-semibold uppercase tracking-wider text-[#9CA89F]">
                  {t("pedia.idealConditions")}
                </Text>
                <Text className="mb-3 text-xs text-[#9CA89F]">{t("pedia.idealCaption")}</Text>
                <ChartCard title={t("pedia.temperature")}>
                  <LineChart
                    values={chartData.map((d) => d.idealTemperature)}
                    labels={climateLabels}
                    color="#4A7C5D"
                    unit="°C"
                  />
                </ChartCard>
                <ChartCard title={t("pedia.humidity")}>
                  <LineChart
                    values={chartData.map((d) => d.idealHumidity)}
                    labels={climateLabels}
                    color="#D4AF37"
                    unit="%"
                  />
                </ChartCard>
                <ChartCard title={t("pedia.rain")}>
                  <LineChart
                    values={chartData.map((d) => d.idealRain)}
                    labels={climateLabels}
                    color="#5B8DEF"
                    unit=" mm"
                  />
                </ChartCard>
                {chartData[0]?.idealPressure != null ? (
                  <ChartCard title={t("pedia.pressure")}>
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
              <ChartCard title={t("pedia.season")} caption={t("pedia.seasonCaption")}>
                <BarChart
                  values={seasonData.map((d) => d.activity)}
                  labels={seasonData.map((d) => d.month)}
                  color="#4A7C5D"
                />
              </ChartCard>
            ) : null}

            {elevationBins.length > 0 ? (
              <ChartCard title={t("pedia.elevation")} caption={t("pedia.elevationCaption")}>
                <BarChart
                  values={relativeValues(elevationBins)}
                  labels={elevationBins.map((b) => `${b.bin_start}`)}
                  color="#2E8B7E"
                />
              </ChartCard>
            ) : null}

            {slopeBins.length > 0 ? (
              <ChartCard title={t("pedia.slope")} caption={t("pedia.slopeCaption")}>
                <BarChart
                  values={relativeValues(slopeBins)}
                  labels={slopeBins.map((b) => `${b.bin_start}`)}
                  color="#4A7C5D"
                />
              </ChartCard>
            ) : null}

            {aspectBins.length > 0 ? (
              <ChartCard title={t("pedia.aspect")} caption={t("pedia.aspectCaption")}>
                <RadarChart items={aspectBinsToRadarData(aspectBins)} color="#D4AF37" />
              </ChartCard>
            ) : null}

            {geomorphon.length > 0 ? (
              <ChartCard title={t("pedia.geomorphon")} caption={t("pedia.geomorphonCaption")}>
                <HBarChart items={geomorphon} color="#5B8DEF" />
              </ChartCard>
            ) : null}

            {landcover.length > 0 ? (
              <ChartCard title={t("pedia.landcover")} caption={t("pedia.landcoverCaption")}>
                <BarChart
                  values={landcover.map((c) => c.value)}
                  labels={landcover.map((c) => c.label)}
                  color="#9B59B6"
                />
              </ChartCard>
            ) : null}
          </>
        ) : null}

        {detail?.statistics?.length ? (
          <View className="mt-2">
            <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#9CA89F]">
              {t("pedia.statistics")}
            </Text>
            {detail.statistics.map((stat) => (
              <View
                key={stat.label}
                className="flex-row justify-between border-b border-[#2D5F3F]/20 py-2"
              >
                <Text className="text-sm text-[#9CA89F]">{stat.label}</Text>
                <Text className="ml-4 flex-1 text-right font-medium text-[#F5F5F0]">{stat.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Subpage>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Flower2, Leaf, Search, Snowflake, Sun } from "lucide-react-native";
import { Subpage } from "../../components/subpage";
import { apiGet, type MushroomEntry } from "../../lib/api";
import { mushroomCommonName } from "../../lib/i18n";
import { bundledPediaList, resolvePediaList } from "../../lib/pedia-catalog";

const SPRING = new Set([3, 4, 5]);
const SUMMER = new Set([6, 7, 8]);
const AUTUMN = new Set([9, 10, 11]);
const WINTER = new Set([12, 1, 2]);

type EdibleFilter = "all" | "edible" | "notEdible";
type SeasonFilter = "all" | "spring" | "summer" | "autumn" | "winter";

function seasonSet(filter: SeasonFilter): Set<number> | null {
  if (filter === "spring") return SPRING;
  if (filter === "summer") return SUMMER;
  if (filter === "autumn") return AUTUMN;
  if (filter === "winter") return WINTER;
  return null;
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`mr-1.5 rounded-full px-2.5 py-1 ${active ? "bg-[#2D5F3F]" : "border border-[#2D5F3F]/50"}`}
    >
      <Text className="text-[11px] font-medium text-[#F5F5F0]">{label}</Text>
    </Pressable>
  );
}

function SeasonIcon({
  icon: Icon,
  label,
  active,
  onPress,
}: {
  icon: typeof Leaf;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`ml-1 h-8 w-8 items-center justify-center rounded-full ${
        active ? "bg-[#2D5F3F]" : "bg-[#1B3022]"
      }`}
    >
      <Icon color={active ? "#F5F5F0" : "#9CA89F"} size={15} strokeWidth={2} />
    </Pressable>
  );
}

function Badge({ mushroom, t }: { mushroom: MushroomEntry; t: (key: string) => string }) {
  if (mushroom.poisonous) {
    return <Text className="text-[10px] font-semibold uppercase text-[#ED8200]">{t("pedia.poisonous")}</Text>;
  }
  if (mushroom.edible) {
    return <Text className="text-[10px] font-semibold uppercase text-[#4A7C5D]">{t("pedia.edible")}</Text>;
  }
  return <Text className="text-[10px] font-semibold uppercase text-[#9CA89F]">{t("pedia.notEdible")}</Text>;
}

export default function MushroompediaList() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [mushrooms, setMushrooms] = useState<MushroomEntry[]>(bundledPediaList);
  const [query, setQuery] = useState("");
  const [edibleFilter, setEdibleFilter] = useState<EdibleFilter>("all");
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");

  useEffect(() => {
    let cancelled = false;
    apiGet<MushroomEntry[]>("/api/mushrooms")
      .then((data) => {
        if (cancelled) return;
        setMushrooms(resolvePediaList(data));
      })
      .catch(() => {
        if (!cancelled) setMushrooms(bundledPediaList());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const months = seasonSet(seasonFilter);
    return mushrooms.filter((mushroom) => {
      if (edibleFilter === "edible" && !mushroom.edible) return false;
      if (edibleFilter === "notEdible" && mushroom.edible) return false;
      if (months) {
        const own = mushroom.seasonMonths ?? [];
        if (!own.some((month) => months.has(month))) return false;
      }
      if (!q) return true;
      const hay = [
        mushroomCommonName(mushroom),
        mushroom.scientificName,
        mushroom.name,
        ...Object.values(mushroom.names ?? {}),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [mushrooms, query, edibleFilter, seasonFilter, i18n.language]);

  const toggleSeason = (value: SeasonFilter) => {
    setSeasonFilter((current) => (current === value ? "all" : value));
  };

  return (
    <Subpage title={t("pedia.title")}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        ListHeaderComponent={
          <View className="mb-2">
            <View className="mb-2 flex-row items-center rounded-lg border border-[#2D5F3F]/50 bg-[#1B3022] px-2.5">
              <Search color="#6B7B6E" size={16} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t("pedia.search")}
                placeholderTextColor="#6B7B6E"
                className="flex-1 px-2 py-2 text-sm text-[#F5F5F0]"
              />
            </View>
            <View className="flex-row items-center justify-between">
              <View className="mr-2 min-w-0 flex-1 flex-row items-center">
                <Chip label={t("pedia.all")} active={edibleFilter === "all"} onPress={() => setEdibleFilter("all")} />
                <Chip
                  label={t("pedia.edible")}
                  active={edibleFilter === "edible"}
                  onPress={() => setEdibleFilter("edible")}
                />
                <Chip
                  label={t("pedia.notEdible")}
                  active={edibleFilter === "notEdible"}
                  onPress={() => setEdibleFilter("notEdible")}
                />
              </View>
              <View className="flex-row items-center">
                <SeasonIcon
                  icon={Flower2}
                  label={t("pedia.seasonSpring")}
                  active={seasonFilter === "spring"}
                  onPress={() => toggleSeason("spring")}
                />
                <SeasonIcon
                  icon={Sun}
                  label={t("pedia.seasonSummer")}
                  active={seasonFilter === "summer"}
                  onPress={() => toggleSeason("summer")}
                />
                <SeasonIcon
                  icon={Leaf}
                  label={t("pedia.seasonAutumn")}
                  active={seasonFilter === "autumn"}
                  onPress={() => toggleSeason("autumn")}
                />
                <SeasonIcon
                  icon={Snowflake}
                  label={t("pedia.seasonWinter")}
                  active={seasonFilter === "winter"}
                  onPress={() => toggleSeason("winter")}
                />
              </View>
            </View>
          </View>
        }
          ListEmptyComponent={
            <Text className="mt-8 text-center text-sm text-[#9CA89F]">{t("pedia.emptyFilter")}</Text>
          }
          renderItem={({ item }) => {
            const photo = item.thumbUrl || item.photos?.[0]?.url;
            return (
              <Pressable
                onPress={() => router.push(`/mushroompedia/${item.id}`)}
                className="mb-1 flex-row items-center gap-3 rounded-xl border border-[#2D5F3F]/20 bg-[#1B3022]/40 px-2 py-2 active:bg-[#2D5F3F]"
              >
                {photo ? (
                  <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-[#0A0E0C]">
                    <Image source={{ uri: photo }} className="h-14 w-14" resizeMode="contain" />
                  </View>
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-lg bg-[#1B3022]">
                    <Leaf color="#4A7C5D" size={22} />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-sm font-medium text-[#F5F5F0]">{mushroomCommonName(item)}</Text>
                  <Text className="text-xs italic text-[#9CA89F]">{item.scientificName}</Text>
                  <View className="mt-1">
                    <Badge mushroom={item} t={t} />
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
    </Subpage>
  );
}

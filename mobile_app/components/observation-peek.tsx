import { Leaf, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { dateLocale, mushroomCommonName } from "../lib/i18n";
import type { MapObservation } from "../lib/cluster-observations";

function formatObservedOn(value: string, language: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(dateLocale(language), {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export function ObservationPeek({
  items,
  onClose,
  onOpen,
  bottom,
  right = 12,
}: {
  items: MapObservation[];
  onClose: () => void;
  onOpen: (item: MapObservation) => void;
  bottom: number;
  right?: number;
}) {
  const { t, i18n } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const cardWidth = Math.max(windowWidth - 12 - right, 200);
  const itemKey = items.map((item) => item.id).join("|");

  useEffect(() => {
    setPage(0);
  }, [itemKey]);

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setPage(Math.max(0, Math.min(items.length - 1, next)));
  }

  return (
    <View
      style={{
        position: "absolute",
        left: 12,
        right,
        bottom,
        zIndex: 3,
        elevation: 12,
      }}
    >
      {items.length > 1 ? (
        <View className="mb-2 flex-row items-center justify-center gap-1.5">
          {items.map((item, index) => (
            <View
              key={item.id}
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
      <View>
        <ScrollView
          horizontal
          pagingEnabled
          nestedScrollEnabled
          style={{ width: cardWidth }}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          keyboardShouldPersistTaps="handled"
        >
          {items.map((item) => (
            <Pressable key={item.id} onPress={() => onOpen(item)} style={{ width: cardWidth }}>
              <View
                style={{
                  flexDirection: "row",
                  overflow: "hidden",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(45,95,63,0.5)",
                  backgroundColor: "#0A0E0C",
                }}
              >
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={{ width: 96, height: 96 }} />
                ) : (
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#1B3022",
                    }}
                  >
                    <Leaf color="#4A7C5D" size={26} />
                  </View>
                )}
                <View className="min-w-0 flex-1 justify-center px-3 py-2 pr-10">
                  <View className="mb-1 flex-row items-center gap-1.5">
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: item.mine ? "#FFE500" : "#ED8200",
                      }}
                    />
                    <Text className="text-xs text-[#9CA89F]" numberOfLines={1}>
                      {item.mine ? t("observations.you") : item.hunterName}
                    </Text>
                  </View>
                  <Text className="text-base font-semibold text-[#F5F5F0]" numberOfLines={1}>
                    {mushroomCommonName(item)}
                  </Text>
                  {item.scientificName ? (
                    <Text className="text-xs italic text-[#9CA89F]" numberOfLines={1}>
                      {item.scientificName}
                    </Text>
                  ) : null}
                  <Text className="mt-1 text-xs text-[#9CA89F]">
                    {formatObservedOn(item.observedOn, i18n.language)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityLabel={t("common.close")}
          style={{
            position: "absolute",
            right: 8,
            top: 8,
            height: 28,
            width: 28,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
            backgroundColor: "rgba(10,14,12,0.85)",
            zIndex: 4,
          }}
        >
          <X color="#F5F5F0" size={16} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

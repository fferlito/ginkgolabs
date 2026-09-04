import { useAuth } from "@clerk/expo";
import { useFocusEffect, useRouter } from "expo-router";
import { Map } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AddEntryButton } from "../../components/add-entry-button";
import { Subpage } from "../../components/subpage";
import { ApiError, apiAuth, type Place } from "../../lib/api";

export default function LocationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setError(null);
        try {
          const token = await getTokenRef.current();
          const rows = await apiAuth<Place[]>("/api/me/places", token);
          if (!cancelled) setPlaces(rows);
        } catch (err) {
          if (!cancelled) {
            setPlaces([]);
            setError(err instanceof ApiError ? err.message : t("locations.loadError"));
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <Subpage
      title={t("locations.title")}
      action={
        <AddEntryButton
          label={t("locations.add")}
          onPress={() => router.push("/locations/new")}
        />
      }
    >
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}>
        {places === null ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator color="#4A7C5D" />
          </View>
        ) : places.length === 0 ? (
          <View className="flex-1 items-center justify-center rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 px-6 py-16">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-[#1B3022]">
              <Map color="#4A7C5D" size={28} />
            </View>
            <Text className="mb-1 text-center text-base font-semibold text-[#F5F5F0]">
              {t("locations.emptyTitle")}
            </Text>
            <Text className="text-center text-sm text-[#9CA89F]">
              {error ?? t("locations.emptyHint")}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {error ? <Text className="text-sm text-[#9CA89F]">{error}</Text> : null}
            {places.map((place) => (
              <Pressable
                key={place.id}
                onPress={() => router.push(`/locations/${place.id}`)}
                className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 px-4 py-3"
              >
                <Text className="text-base font-semibold text-[#F5F5F0]">{place.name}</Text>
                {place.notes ? (
                  <Text className="mt-1 text-sm text-[#9CA89F]">{place.notes}</Text>
                ) : null}
                {place.latitude != null && place.longitude != null ? (
                  <Text className="mt-1 text-xs text-[#4A7C5D]">
                    {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
                  </Text>
                ) : (
                  <Text className="mt-1 text-xs text-[#9CA89F]">{t("locations.noCoordinates")}</Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Subpage>
  );
}

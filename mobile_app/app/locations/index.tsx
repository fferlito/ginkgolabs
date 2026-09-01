import { useAuth } from "@clerk/expo";
import { useFocusEffect, useRouter } from "expo-router";
import { Map } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { AddEntryButton } from "../../components/add-entry-button";
import { Subpage } from "../../components/subpage";
import { ApiError, apiAuth, type Place } from "../../lib/api";

export default function LocationsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setError(null);
        try {
          const token = await getToken();
          const rows = await apiAuth<Place[]>("/api/me/places", token);
          if (!cancelled) setPlaces(rows);
        } catch (err) {
          if (!cancelled) {
            setPlaces([]);
            setError(err instanceof ApiError ? err.message : "Could not load locations.");
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [getToken]),
  );

  return (
    <Subpage
      title="My locations"
      action={
        <AddEntryButton
          label="Add location"
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
              No saved places yet
            </Text>
            <Text className="text-center text-sm text-[#9CA89F]">
              {error ?? "Tap + to add a location with optional GPS coordinates."}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {error ? <Text className="text-sm text-[#9CA89F]">{error}</Text> : null}
            {places.map((place) => (
              <View
                key={place.id}
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
                  <Text className="mt-1 text-xs text-[#9CA89F]">No coordinates</Text>
                )}
              </View>
            ))}
          </View>
        )}
        <Pressable onPress={() => router.push("/locations/new")} className="mt-4 py-2">
          <Text className="text-center text-sm text-[#4A7C5D]">Add another location</Text>
        </Pressable>
      </ScrollView>
    </Subpage>
  );
}

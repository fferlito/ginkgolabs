import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MushroomIcon } from "../../components/mushroom-icon";
import { Subpage } from "../../components/subpage";
import { apiGet, type MushroomEntry } from "../../lib/api";

export default function MushroompediaList() {
  const router = useRouter();
  const [mushrooms, setMushrooms] = useState<MushroomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<MushroomEntry[]>("/api/mushrooms")
      .then((data) => {
        if (cancelled) return;
        if (data?.length) {
          setMushrooms(data);
          setError(null);
        } else {
          setError("Could not load mushrooms from the API.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load mushrooms from the API.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Subpage title="Mushroompedia">
      {loading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator color="#4A7C5D" size="large" />
          <Text className="text-sm text-[#9CA89F]">Loading Mushroompedia…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          {error ? (
            <Text className="mb-4 text-sm text-[#ED8200]">{error}</Text>
          ) : null}
          <View className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-2">
            {mushrooms.map((mushroom) => (
              <Pressable
                key={mushroom.id}
                onPress={() => router.push(`/mushroompedia/${mushroom.id}`)}
                className="mb-0.5 flex-row items-center gap-3 rounded-lg px-3 py-2.5 active:bg-[#2D5F3F]"
              >
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#1B3022]">
                  <MushroomIcon
                    name={mushroom.name}
                    scientificName={mushroom.scientificName}
                    id={mushroom.id}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-[#F5F5F0]">{mushroom.name}</Text>
                  <Text className="text-xs italic text-[#9CA89F]">{mushroom.scientificName}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </Subpage>
  );
}

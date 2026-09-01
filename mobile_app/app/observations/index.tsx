import { useAuth } from "@clerk/expo";
import { useFocusEffect, useRouter } from "expo-router";
import { Leaf } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { AddEntryButton } from "../../components/add-entry-button";
import { Subpage } from "../../components/subpage";
import { ApiError, apiAuth, type Observation } from "../../lib/api";

export default function ObservationsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [rows, setRows] = useState<Observation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setError(null);
        try {
          const token = await getToken();
          const data = await apiAuth<Observation[]>("/api/me/observations", token);
          if (!cancelled) setRows(data);
        } catch (err) {
          if (!cancelled) {
            setRows([]);
            setError(err instanceof ApiError ? err.message : "Could not load observations.");
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
      title="My observations"
      action={
        <AddEntryButton
          label="Add observation"
          onPress={() => router.push("/observations/new")}
        />
      }
    >
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}>
        {rows === null ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator color="#4A7C5D" />
          </View>
        ) : rows.length === 0 ? (
          <View className="flex-1 items-center justify-center rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 px-6 py-16">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-[#1B3022]">
              <Leaf color="#4A7C5D" size={28} />
            </View>
            <Text className="mb-1 text-center text-base font-semibold text-[#F5F5F0]">
              No observations yet
            </Text>
            <Text className="text-center text-sm text-[#9CA89F]">
              {error ?? "Tap + to log a find with a photo, species, and coordinates."}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {error ? <Text className="text-sm text-[#9CA89F]">{error}</Text> : null}
            {rows.map((row) => (
              <View
                key={row.id}
                className="flex-row overflow-hidden rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40"
              >
                {row.photoUrl ? (
                  <Image source={{ uri: row.photoUrl }} className="h-24 w-24" />
                ) : (
                  <View className="h-24 w-24 items-center justify-center bg-[#1B3022]">
                    <Leaf color="#4A7C5D" size={22} />
                  </View>
                )}
                <View className="flex-1 justify-center px-3 py-2">
                  <Text className="text-base font-semibold text-[#F5F5F0]">{row.speciesName}</Text>
                  {row.scientificName ? (
                    <Text className="text-xs italic text-[#9CA89F]">{row.scientificName}</Text>
                  ) : null}
                  <Text className="mt-1 text-xs text-[#9CA89F]">{row.observedOn}</Text>
                  {row.isPublic ? (
                    <Text className="mt-1 text-xs text-[#4A7C5D]">Public</Text>
                  ) : (
                    <Text className="mt-1 text-xs text-[#9CA89F]">Private</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Subpage>
  );
}

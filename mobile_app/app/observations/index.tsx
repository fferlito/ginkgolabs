import { useAuth } from "@clerk/expo";
import { useFocusEffect, useRouter } from "expo-router";
import { Leaf } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AddEntryButton } from "../../components/add-entry-button";
import { Subpage } from "../../components/subpage";
import { ApiError, apiAuth, type Observation } from "../../lib/api";
import { mushroomCommonName } from "../../lib/i18n";

function keepPhotoUrls(prev: Observation[] | null, next: Observation[]): Observation[] {
  if (!prev?.length) return next;
  const cached = new Map(
    prev.filter((row) => row.photoObject && row.photoUrl).map((row) => [row.photoObject, row.photoUrl]),
  );
  return next.map((row) => {
    const photoUrl = cached.get(row.photoObject);
    return photoUrl ? { ...row, photoUrl } : row;
  });
}

export default function ObservationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [rows, setRows] = useState<Observation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setError(null);
        try {
          const token = await getTokenRef.current();
          const data = await apiAuth<Observation[]>("/api/me/observations", token);
          if (!cancelled) setRows((prev) => keepPhotoUrls(prev, data));
        } catch (err) {
          if (!cancelled) {
            setRows([]);
            setError(err instanceof ApiError ? err.message : t("observations.loadError"));
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
      title={t("observations.title")}
      action={
        <AddEntryButton
          label={t("observations.add")}
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
              {t("observations.emptyTitle")}
            </Text>
            <Text className="text-center text-sm text-[#9CA89F]">
              {error ?? t("observations.emptyHint")}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {error ? <Text className="text-sm text-[#9CA89F]">{error}</Text> : null}
            {rows.map((row) => (
              <Pressable
                key={row.id}
                onPress={() => router.push(`/observations/${row.id}`)}
                className="flex-row overflow-hidden rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40"
              >
                {row.photoUrl ? (
                  <Image key={row.id} source={{ uri: row.photoUrl }} className="h-24 w-24" />
                ) : (
                  <View className="h-24 w-24 items-center justify-center bg-[#1B3022]">
                    <Leaf color="#4A7C5D" size={22} />
                  </View>
                )}
                <View className="flex-1 justify-center px-3 py-2">
                  <Text className="text-base font-semibold text-[#F5F5F0]">{mushroomCommonName(row)}</Text>
                  {row.scientificName ? (
                    <Text className="text-xs italic text-[#9CA89F]">{row.scientificName}</Text>
                  ) : null}
                  <Text className="mt-1 text-xs text-[#9CA89F]">{row.observedOn}</Text>
                  {row.isPublic ? (
                    <Text className="mt-1 text-xs text-[#4A7C5D]">{t("observations.public")}</Text>
                  ) : (
                    <Text className="mt-1 text-xs text-[#9CA89F]">{t("observations.private")}</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Subpage>
  );
}

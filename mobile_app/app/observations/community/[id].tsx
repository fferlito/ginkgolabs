import { useAuth } from "@clerk/expo";
import { Leaf } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MiniMap } from "../../../components/mini-map";
import { ObservationActions } from "../../../components/observation-actions";
import { Subpage } from "../../../components/subpage";
import { ApiError, apiAuth, type CommunityObservation } from "../../../lib/api";
import { mushroomCommonName } from "../../../lib/i18n";
import { upsertMapPlacePin } from "../../../lib/map-place-pins";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm text-[#9CA89F]">{label}</Text>
      <Text className="text-base text-[#F5F5F0]">{value}</Text>
    </View>
  );
}

export default function CommunityObservationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const { id } = useLocalSearchParams<{ id: string }>();
  const observationId = Array.isArray(id) ? id[0] : id;

  const [obs, setObs] = useState<CommunityObservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!observationId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const data = await apiAuth<CommunityObservation>(
        `/api/me/observations/community/${observationId}`,
        token,
      );
      setObs(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("observations.loadOneError"));
    } finally {
      setLoading(false);
    }
  }, [observationId]);

  useEffect(() => {
    load();
  }, [load]);

  function goToLocation() {
    if (!obs) return;
    upsertMapPlacePin({
      id: obs.id,
      name: mushroomCommonName(obs),
      notes: null,
      latitude: obs.latitude,
      longitude: obs.longitude,
      photoUrl: obs.photoUrl ?? null,
    });
    router.dismissTo({
      pathname: "/map",
      params: {
        placeId: obs.id,
        lat: String(obs.latitude),
        lng: String(obs.longitude),
        name: mushroomCommonName(obs),
        notes: "",
        ts: String(Date.now()),
      },
    });
  }

  if (loading || !obs) {
    return (
      <Subpage title={t("observations.titleFallback")}>
        <View className="flex-1 items-center justify-center">
          {loading ? (
            <ActivityIndicator color="#4A7C5D" />
          ) : (
            <Text className="px-4 text-center text-sm text-[#E8B86D]">{error ?? t("common.notFound")}</Text>
          )}
        </View>
      </Subpage>
    );
  }

  return (
    <Subpage title={mushroomCommonName(obs)}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {obs.photoUrl ? (
          <Image source={{ uri: obs.photoUrl }} className="mb-4 h-64 w-full rounded-xl" />
        ) : (
          <View className="mb-4 h-64 items-center justify-center rounded-xl bg-[#1B3022]">
            <Leaf color="#4A7C5D" size={36} />
          </View>
        )}
        {obs.scientificName ? (
          <Text className="mb-4 text-sm italic text-[#9CA89F]">{obs.scientificName}</Text>
        ) : null}
        <Field label={t("observations.hunter")} value={obs.hunterName || t("common.user")} />
        <Field label={t("common.date")} value={obs.observedOn} />
        <Text className="mb-2 text-sm text-[#9CA89F]">{t("common.location")}</Text>
        <MiniMap latitude={obs.latitude} longitude={obs.longitude} onOpen={goToLocation} />
        {error ? <Text className="mb-3 text-sm text-[#E8B86D]">{error}</Text> : null}
        <ObservationActions
          name={mushroomCommonName(obs)}
          scientificName={obs.scientificName}
          latitude={obs.latitude}
          longitude={obs.longitude}
        />
      </ScrollView>
    </Subpage>
  );
}

import { useAuth } from "@clerk/expo";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Subpage } from "../components/subpage";
import { ApiError, apiAuth, type IdentifyResult } from "../lib/api";
import { currentCoords } from "../lib/geo";
import { setPendingScanPhoto } from "../lib/pending-scan";

export default function ScanScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<IdentifyResult[] | null>(null);

  async function snap() {
    setError(null);
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (!photo?.uri) return;
    setPhotoUri(photo.uri);
    setResults(null);
  }

  async function identify() {
    if (!photoUri) return;
    setBusy(true);
    setError(null);
    try {
      const coords = await currentCoords();
      const token = await getToken();
      const form = new FormData();
      form.append("image", {
        uri: photoUri,
        name: "scan.jpg",
        type: "image/jpeg",
      } as unknown as Blob);
      if (coords) {
        form.append("latitude", String(coords.latitude));
        form.append("longitude", String(coords.longitude));
      }
      const data = await apiAuth<{ results: IdentifyResult[] }>("/api/me/identify", token, {
        method: "POST",
        body: form,
      });
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not identify this photo.");
    } finally {
      setBusy(false);
    }
  }

  function saveAs(result: IdentifyResult) {
    if (!photoUri) return;
    setPendingScanPhoto({ uri: photoUri, mimeType: "image/jpeg" });
    const speciesName = result.commonName || result.scientificName;
    router.push({
      pathname: "/observations/new",
      params: {
        speciesName,
        scientificName: result.scientificName,
        source: "scan",
      },
    });
  }

  if (!permission) {
    return (
      <Subpage title="Scan mode">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4A7C5D" />
        </View>
      </Subpage>
    );
  }

  if (!permission.granted) {
    return (
      <Subpage title="Scan mode">
        <View className="px-4">
          <Text className="mb-4 text-sm text-[#9CA89F]">
            Camera access is needed to photograph a mushroom for identification.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="items-center rounded-xl bg-[#2D5F3F] py-3"
          >
            <Text className="font-semibold text-[#F5F5F0]">Allow camera</Text>
          </Pressable>
        </View>
      </Subpage>
    );
  }

  return (
    <Subpage title="Scan mode">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <View className="mb-4 overflow-hidden rounded-xl border border-[#2D5F3F]/30" style={{ height: 320 }}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} className="h-full w-full" />
          ) : (
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
          )}
        </View>
        <View className="mb-4 flex-row gap-3">
          {photoUri ? (
            <Pressable
              onPress={() => {
                setPhotoUri(null);
                setResults(null);
              }}
              className="flex-1 items-center rounded-xl border border-[#2D5F3F] py-3"
            >
              <Text className="font-semibold text-[#F5F5F0]">Retake</Text>
            </Pressable>
          ) : (
            <Pressable onPress={snap} className="flex-1 items-center rounded-xl bg-[#2D5F3F] py-3">
              <Text className="font-semibold text-[#F5F5F0]">Capture</Text>
            </Pressable>
          )}
          <Pressable
            onPress={identify}
            disabled={!photoUri || busy}
            className={`flex-1 items-center rounded-xl py-3 ${
              photoUri ? "bg-[#2D5F3F]" : "bg-[#1B3022]"
            }`}
          >
            {busy ? (
              <ActivityIndicator color="#F5F5F0" />
            ) : (
              <Text className="font-semibold text-[#F5F5F0]">Identify</Text>
            )}
          </Pressable>
        </View>
        <Text className="mb-4 text-xs text-[#9CA89F]">
          Predictions are not foraging advice. Never eat a mushroom based on this scan.
        </Text>
        {error ? <Text className="mb-3 text-sm text-[#E8B86D]">{error}</Text> : null}
        {results && results.length === 0 ? (
          <Text className="text-sm text-[#9CA89F]">No matches. Try a closer, well-lit photo.</Text>
        ) : null}
        {results?.map((row) => (
          <Pressable
            key={`${row.taxonId}-${row.scientificName}`}
            onPress={() => saveAs(row)}
            className="mb-2 rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 px-4 py-3"
          >
            <Text className="text-base font-semibold text-[#F5F5F0]">
              {row.commonName || row.scientificName}
            </Text>
            {row.commonName && row.scientificName ? (
              <Text className="text-xs italic text-[#9CA89F]">{row.scientificName}</Text>
            ) : null}
            <Text className="mt-1 text-xs text-[#4A7C5D]">
              {Math.round(row.score <= 1 ? row.score * 100 : row.score)}% · tap to save as observation
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Subpage>
  );
}

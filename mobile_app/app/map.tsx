import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Linking,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import Mapbox, {
  Camera,
  FillLayer,
  LineLayer,
  MapView,
  MarkerView,
  VectorSource,
} from "@rnmapbox/maps";
import { Compass, Eye, EyeOff, Locate, Map, Satellite } from "lucide-react-native";
import type { MushroomData } from "../data/mushrooms/types";
import boletus from "../data/mushrooms/boletus_edulis.json";
import cantharellus from "../data/mushrooms/Cantharellus.json";
import morchella from "../data/mushrooms/galletto.json";
import psilocybe from "../data/mushrooms/Psilocybe.json";
import { MenuButton, SideMenu } from "../components/side-menu";
import { MushroomIcon } from "../components/mushroom-icon";
import { StatsPanel } from "../components/stats-panel";

const mushrooms = [boletus, cantharellus, morchella, psilocybe] as MushroomData[];

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}

const STYLES = {
  custom: "mapbox://styles/ferlixxx/cm8xkvecy000o01s6fy1h60qi",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
} as const;

const FILL_COLOR: ["interpolate", ...unknown[]] = [
  "interpolate",
  ["linear"],
  ["get", "species_prediction"],
  0.0,
  "#5E0000",
  0.4,
  "#ED8200",
  0.6,
  "#FFE500",
  0.9,
  "#00DE1A",
  1.0,
  "#004D1B",
];

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function dateFolder(selectedDate: string): "today" | "tomorrow" | "later" {
  const today = formatYmd(new Date());
  const tomorrow = formatYmd(addDays(new Date(), 1));
  if (selectedDate === today) return "today";
  if (selectedDate === tomorrow) return "tomorrow";
  return "later";
}

function tileUrlsForDate(mushroom: MushroomData, selectedDate: string): string[] {
  const folder = dateFolder(selectedDate);
  const urls =
    folder === "today"
      ? mushroom.tileUrls.today
      : folder === "tomorrow"
        ? mushroom.tileUrls.tomorrow
        : mushroom.tileUrls.later;
  return urls.map((url) => {
    let next = url.replace(/\/(today|tomorrow|later)\//g, `/${folder}/`);
    next = next.replace(/([?&])date=[^&]*/g, "").replace(/[?&]$/, "");
    const sep = next.includes("?") ? "&" : "?";
    return `${next}${sep}date=${selectedDate}`;
  });
}

function predictionFromProperties(
  properties: { species_prediction?: number | string } | null | undefined
): number | null {
  const raw = properties?.species_prediction;
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  return Number.isFinite(n) ? n : null;
}

const today = new Date();
const dateOptions = [0, 1, 2].map((i) => {
  const d = addDays(today, i);
  return {
    fullDate: formatYmd(d),
    dayText: i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" }),
    dayNumber: String(d.getDate()),
  };
});

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const [selectedMushroom, setSelectedMushroom] = useState<MushroomData>(
    mushrooms.find((m) => m.default) ?? mushrooms[0]
  );
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].fullDate);
  const [mapStyle, setMapStyle] = useState<"custom" | "satellite">("custom");
  const [layerVisible, setLayerVisible] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [popup, setPopup] = useState<{
    longitude: number;
    latitude: number;
    prediction: number;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{
    lat: number;
    lng: number;
    prediction: number;
  } | null>(null);
  const [userCoord, setUserCoord] = useState<[number, number] | null>(null);
  const didCenterOnUser = useRef(false);

  const tileUrls = tileUrlsForDate(selectedMushroom, selectedDate);
  const showLayer = layerVisible && tileUrls.length > 0;

  function tryCenterOnUser(coord: [number, number]) {
    if (didCenterOnUser.current || !cameraRef.current) return;
    didCenterOnUser.current = true;
    cameraRef.current.setCamera({
      centerCoordinate: coord,
      zoomLevel: 14,
      pitch: 45,
      heading: 0,
      animationDuration: 800,
    });
  }

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission denied:", status);
        return;
      }
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) {
          setUserCoord([last.coords.longitude, last.coords.latitude]);
        }
        if (!last) {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!cancelled) {
            setUserCoord([pos.coords.longitude, pos.coords.latitude]);
          }
        }
        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 5,
          },
          (update) => {
            const next: [number, number] = [
              update.coords.longitude,
              update.coords.latitude,
            ];
            setUserCoord((prev) => {
              if (
                prev &&
                Math.abs(prev[0] - next[0]) < 0.00015 &&
                Math.abs(prev[1] - next[1]) < 0.00015
              ) {
                return prev;
              }
              return next;
            });
          }
        );
      } catch (err) {
        console.warn("Could not read current location", err);
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  useEffect(() => {
    if (userCoord) tryCenterOnUser(userCoord);
  }, [userCoord]);

  async function handleGeolocate() {
    setLocationError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Location permission denied:", status);
      setLocationError(`Location permission denied (${status})`);
      return;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    setUserCoord([pos.coords.longitude, pos.coords.latitude]);
    cameraRef.current?.setCamera({
      centerCoordinate: [pos.coords.longitude, pos.coords.latitude],
      zoomLevel: 14,
      animationDuration: 1500,
    });
  }

  function handleCompass() {
    cameraRef.current?.setCamera({
      heading: 0,
      pitch: 45,
      animationDuration: 600,
    });
  }

  if (!MAPBOX_TOKEN) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0A0E0C] px-6">
        <Text className="text-center text-[#ED8200]">
          Missing EXPO_PUBLIC_MAPBOX_TOKEN in mobile_app/.env
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0E0C]">
      <MapView
        style={{ flex: 1 }}
        styleURL={STYLES[mapStyle]}
        scaleBarEnabled={false}
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={() => {
          if (userCoord) tryCenterOnUser(userCoord);
        }}
        onMapLoadingError={() => {
          console.error("Mapbox failed to load style");
          setMapError("Mapbox failed to load style");
        }}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [11.3285, 43.3188],
            zoomLevel: 11,
            pitch: 45,
            heading: 0,
          }}
        />
        {showLayer
          ? tileUrls.map((url, idx) => {
              const sourceId = `mushroom-polygons-${dateFolder(selectedDate)}-${idx}`;
              return (
              <VectorSource
                key={`${selectedMushroom.scientificName}-${selectedDate}-${idx}`}
                id={sourceId}
                tileUrlTemplates={[url]}
                minZoomLevel={10}
                maxZoomLevel={14}
                onPress={(event) => {
                  const feature = event.features[0];
                  const prediction = predictionFromProperties(
                    feature?.properties as { species_prediction?: number | string } | undefined
                  );
                  if (prediction == null) {
                    console.warn("Tap had no species_prediction", feature?.properties);
                    setPopup(null);
                    return;
                  }
                  setPopup({
                    longitude: event.coordinates.longitude,
                    latitude: event.coordinates.latitude,
                    prediction,
                  });
                }}
              >
                <FillLayer
                  id={`mushroom-fill-${dateFolder(selectedDate)}-${idx}`}
                  sourceLayerID="predictions"
                  style={{
                    fillColor: FILL_COLOR as never,
                    fillOpacity: 0.6,
                  }}
                />
                <LineLayer
                  id={`mushroom-outline-${dateFolder(selectedDate)}-${idx}`}
                  sourceLayerID="predictions"
                  style={{
                    lineColor: "#000",
                    lineWidth: 1,
                    lineOpacity: 0.1,
                  }}
                />
              </VectorSource>
              );
            })
          : null}
        {userCoord ? (
          <MarkerView
            coordinate={userCoord}
            anchor={{ x: 0.5, y: 0.5 }}
            allowOverlap
            allowOverlapWithPuck
            pointerEvents="none"
          >
            <View
              pointerEvents="none"
              style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
            >
              <View
                style={{
                  position: "absolute",
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(66, 133, 244, 0.25)",
                }}
              />
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: "#4285F4",
                  borderWidth: 3,
                  borderColor: "#FFFFFF",
                }}
              />
            </View>
          </MarkerView>
        ) : null}
        {popup ? (
          <MarkerView coordinate={[popup.longitude, popup.latitude]} allowOverlap>
            <View className="items-center rounded-lg border border-[#2D5F3F] bg-[#0A0E0C] px-3 py-2">
              <Text className="font-semibold text-[#F5F5F0]">
                Probability: {(popup.prediction * 100).toFixed(1)}%
              </Text>
              <Pressable
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps?q=${popup.latitude.toFixed(6)},${popup.longitude.toFixed(6)}`
                  )
                }
              >
                <Text className="mt-1 text-sm text-[#4A7C5D]">Open in Maps</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSelectedPoint({
                    lat: popup.latitude,
                    lng: popup.longitude,
                    prediction: popup.prediction,
                  });
                  setStatsOpen(true);
                }}
              >
                <Text className="mt-1 text-sm text-[#4A7C5D]">Show stats</Text>
              </Pressable>
              <Pressable onPress={() => setPopup(null)}>
                <Text className="mt-1 text-xs text-[#9CA89F]">Close</Text>
              </Pressable>
            </View>
          </MarkerView>
        ) : null}
      </MapView>

      <View
        className="absolute left-5"
        style={{ top: insets.top + 8, zIndex: 1, elevation: 0 }}
        pointerEvents="box-none"
      >
        <MenuButton onPress={() => setMenuOpen(true)} />
      </View>

      <View
        className="absolute right-5 items-end gap-3"
        style={{ top: insets.top + 8, zIndex: 1, elevation: 0 }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => setPickerOpen(true)}
          className={`flex-row items-center gap-3 rounded-xl border-2 px-4 py-2 ${
            layerVisible
              ? "border-[#2D5F3F] bg-[#2D5F3F]"
              : "border-[#2D5F3F]/30 bg-[#0A0E0C]/90"
          }`}
        >
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#1B3022]">
            <MushroomIcon
              name={selectedMushroom.name}
              scientificName={selectedMushroom.scientificName}
              id={selectedMushroom.id}
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-[#F5F5F0]">{selectedMushroom.name}</Text>
            <Text className="text-xs italic text-[#9CA89F]">
              {selectedMushroom.scientificName}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setLayerVisible((v) => !v);
              setPopup(null);
            }}
            className="ml-1 border-l border-[#2D5F3F]/30 pl-2"
          >
            {layerVisible ? (
              <Eye color="#F5F5F0" size={20} />
            ) : (
              <EyeOff color="#9CA89F" size={20} />
            )}
          </Pressable>
        </Pressable>

        <Pressable
          onPress={() => setMapStyle((s) => (s === "custom" ? "satellite" : "custom"))}
          className={`h-12 w-12 items-center justify-center rounded-full border-2 ${
            mapStyle === "satellite"
              ? "border-[#2D5F3F] bg-[#2D5F3F]"
              : "border-[#2D5F3F]/50 bg-[#0A0E0C]/90"
          }`}
        >
          {mapStyle === "satellite" ? (
            <Satellite color="#F5F5F0" size={24} />
          ) : (
            <Map color="#F5F5F0" size={24} />
          )}
        </Pressable>
        <Pressable
          onPress={handleGeolocate}
          className="h-12 w-12 items-center justify-center rounded-full border-2 border-[#2D5F3F]/50 bg-[#0A0E0C]/90"
        >
          <Locate color="#F5F5F0" size={24} />
        </Pressable>
        <Pressable
          onPress={handleCompass}
          className="h-12 w-12 items-center justify-center rounded-full border-2 border-[#2D5F3F]/50 bg-[#0A0E0C]/90"
        >
          <Compass color="#F5F5F0" size={24} />
        </Pressable>
      </View>

      {mapError ? (
        <View className="absolute left-4 right-4 top-1/3 rounded-xl border border-[#5E0000] bg-[#0A0E0C]/95 p-3">
          <Text className="text-sm text-[#ED8200]">Map failed to load</Text>
          <Text className="mt-1 text-xs text-[#9CA89F]">{mapError}</Text>
        </View>
      ) : null}
      {locationError ? (
        <View className="absolute bottom-28 left-4 right-4 rounded-xl bg-[#0A0E0C]/90 p-3" style={{ bottom: 112 + insets.bottom }}>
          <Text className="text-sm text-[#ED8200]">{locationError}</Text>
        </View>
      ) : null}

      <View
        className="absolute bottom-0 left-0 right-0 bg-[#0A0E0C]"
        style={{ paddingBottom: insets.bottom }}
      >
        <View className="flex-row border-b border-white/10 bg-black/60">
          {dateOptions.map((dateObj) => (
            <Pressable
              key={dateObj.fullDate}
              onPress={() => {
                setSelectedDate(dateObj.fullDate);
                setPopup(null);
              }}
              className={`flex-1 items-center py-2 ${
                selectedDate === dateObj.fullDate ? "bg-white/20" : ""
              }`}
            >
              <Text className="text-[11px] font-medium uppercase tracking-wide text-[#F5F5F0]">
                {dateObj.dayText}
              </Text>
              <Text className="text-sm font-medium text-[#F5F5F0]">{dateObj.dayNumber}</Text>
            </Pressable>
          ))}
        </View>
        <View className="h-6 w-full justify-center">
          <LinearGradient
            colors={["#5E0000", "#ED8200", "#FFE500", "#00DE1A", "#004D1B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View className="h-6 w-full flex-row items-center justify-between px-3">
            {["0", "50", "100"].map((label) => (
              <Text
                key={label}
                className="text-xs font-semibold text-[#F5F5F0]"
                style={{ textShadowColor: "#000", textShadowRadius: 2 }}
              >
                {label}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <StatsPanel
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        point={selectedPoint}
        mushroomId={selectedMushroom.id ?? null}
      />

      <Modal visible={pickerOpen} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <Pressable
            className="absolute inset-0"
            onPress={() => setPickerOpen(false)}
          />
          <View className="w-full max-w-md rounded-xl border border-[#2D5F3F]/30 bg-[#0A0E0C] p-5">
            <View className="mb-4 flex-row items-center justify-between border-b border-[#2D5F3F]/30 pb-3">
              <Text className="text-lg font-semibold text-[#F5F5F0]">Select a Mushroom</Text>
              <Pressable onPress={() => setPickerOpen(false)}>
                <Text className="text-2xl text-[#9CA89F]">×</Text>
              </Pressable>
            </View>
            {mushrooms.map((mushroom) => {
              const active = selectedMushroom.scientificName === mushroom.scientificName;
              return (
                <Pressable
                  key={mushroom.scientificName}
                  onPress={() => {
                    setSelectedMushroom(mushroom);
                    setPickerOpen(false);
                    setPopup(null);
                  }}
                  className={`mb-3 flex-row items-center gap-3 rounded-xl border-2 px-4 py-2 ${
                    active
                      ? "border-[#2D5F3F] bg-[#2D5F3F]"
                      : "border-[#2D5F3F]/30 bg-[#0A0E0C]"
                  }`}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#1B3022]">
                    <MushroomIcon
                      name={mushroom.name}
                      scientificName={mushroom.scientificName}
                      id={mushroom.id}
                    />
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-[#F5F5F0]">{mushroom.name}</Text>
                    <Text className="text-xs italic text-[#9CA89F]">
                      {mushroom.scientificName}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth, useUser } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { ChevronDown, Compass, Eye, EyeOff, Leaf, Locate, Map, Menu, Search, Satellite, X } from "lucide-react-native";
import type { MushroomData } from "../data/mushrooms/types";
import boletus from "../data/mushrooms/boletus_edulis.json";
import cantharellus from "../data/mushrooms/Cantharellus.json";
import morchella from "../data/mushrooms/galletto.json";
import psilocybe from "../data/mushrooms/Psilocybe.json";
import { useTranslation } from "react-i18next";
import { SideMenu } from "../components/side-menu";
import { MapLayersPanel } from "../components/map-layers-panel";
import { MushroomIcon } from "../components/mushroom-icon";
import { ObservationPeek } from "../components/observation-peek";
import { StatsPanel } from "../components/stats-panel";
import { ApiError, apiAuth, type CommunityObservation, type Observation, type Place } from "../lib/api";
import {
  boundsEqual,
  clusterIsTight,
  clusterObservations,
  snapBounds,
  type MapBounds,
  type MapObservation,
  type ObservationCluster,
} from "../lib/cluster-observations";
import { dateLocale, mushroomCommonName } from "../lib/i18n";
import {
  getMapPlacePins,
  removeMapPlacePin,
  upsertMapPlacePin,
  type MapPlacePin,
} from "../lib/map-place-pins";

const mushrooms = [boletus, cantharellus, morchella, psilocybe] as MushroomData[];

function mushroomAliases(mushroom: MushroomData): string[] {
  return [mushroom.scientificName, mushroom.name, mushroom.id]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim().toLowerCase());
}

function observationSpeciesKeys(obs: { speciesName?: string | null; scientificName?: string | null }): string[] {
  return [obs.scientificName, obs.speciesName]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim().toLowerCase());
}

function matchesSpeciesFilter(
  obs: { speciesName?: string | null; scientificName?: string | null },
  filterKey: string | null,
): boolean {
  if (!filterKey) return true;
  const names = observationSpeciesKeys(obs);
  if (names.includes(filterKey)) return true;
  const catalog = mushrooms.find((mushroom) => mushroomAliases(mushroom).includes(filterKey));
  if (!catalog) return false;
  const aliases = mushroomAliases(catalog);
  return names.some((name) => aliases.includes(name) || aliases.some((alias) => name.includes(alias) || alias.includes(name)));
}

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
    isToday: i === 0,
    date: d,
    dayNumber: String(d.getDate()),
  };
});

function PlacePinMark() {
  return (
    <View style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: "#4A7C5D",
          borderWidth: 3,
          borderColor: "#F5F5F0",
        }}
      />
    </View>
  );
}

function ObservationDot({ color, selected }: { color: string; selected?: boolean }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: selected ? 16 : 14,
          height: selected ? 16 : 14,
          borderRadius: 8,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: selected ? "#F5F5F0" : "#0A0E0C",
        }}
      />
    </View>
  );
}

function ClusterMark({
  cluster,
  zoom,
  selected,
}: {
  cluster: ObservationCluster;
  zoom: number;
  selected: boolean;
}) {
  const count = cluster.items.length;
  if (count === 1) {
    return (
      <ObservationDot
        color={cluster.items[0].mine ? "#FFE500" : "#ED8200"}
        selected={selected}
      />
    );
  }
  const size = Math.min(44, 28 + Math.log2(count) * 4);
  if (zoom >= 14) {
    const first = cluster.items[0];
    return (
      <View style={{ alignItems: "center", minWidth: 40 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#1B3022",
            borderWidth: 2,
            borderColor: selected ? "#FFE500" : "#F5F5F0",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MushroomIcon
            name={first.speciesName}
            scientificName={first.scientificName ?? undefined}
            size={20}
          />
        </View>
        <Text
          style={{
            marginTop: 2,
            color: "#F5F5F0",
            fontSize: 11,
            fontWeight: "700",
            textShadowColor: "#000",
            textShadowRadius: 3,
          }}
        >
          {`x${count > 99 ? "99+" : count}`}
        </Text>
      </View>
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#2D5F3F",
        borderWidth: 2,
        borderColor: selected ? "#FFE500" : "#F5F5F0",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#F5F5F0", fontSize: size > 34 ? 14 : 12, fontWeight: "700" }}>
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}

function hunterFromUser(
  user: {
    firstName?: string | null;
    username?: string | null;
    primaryEmailAddress?: { emailAddress?: string } | null;
  } | null | undefined,
  fallback: string,
): string {
  const first = user?.firstName?.trim();
  if (first) return first;
  const username = user?.username?.trim();
  if (username) return username;
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const local = email.split("@")[0]?.trim();
  return local || fallback;
}

type PlaceHit = {
  id: string;
  title: string;
  subtitle: string | null;
  latitude: number;
  longitude: number;
  kind: "saved" | "geocode";
  notes: string | null;
  photoUrl: string | null;
};

async function geocodePlaces(
  query: string,
  proximity: [number, number] | null,
): Promise<PlaceHit[]> {
  if (!MAPBOX_TOKEN) return [];
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    autocomplete: "true",
    limit: "6",
  });
  if (proximity) params.set("proximity", `${proximity[0]},${proximity[1]}`);
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    features?: { id: string; place_name: string; text: string; center: [number, number] }[];
  };
  return (data.features ?? []).map((feature) => ({
    id: feature.id,
    title: feature.text,
    subtitle: feature.place_name,
    longitude: feature.center[0],
    latitude: feature.center[1],
    kind: "geocode",
    notes: null,
    photoUrl: null,
  }));
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const { getToken } = useAuth();
  const { user } = useUser();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{
    placeId?: string;
    lat?: string;
    lng?: string;
    name?: string;
    notes?: string;
    ts?: string;
  }>();
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
  const [placePins, setPlacePins] = useState<MapPlacePin[]>(() => getMapPlacePins());
  const [locationPins, setLocationPins] = useState<MapPlacePin[]>([]);
  const [myObservations, setMyObservations] = useState<Observation[]>([]);
  const [communityObs, setCommunityObs] = useState<CommunityObservation[]>([]);
  const [showLocations, setShowLocations] = useState(false);
  const [showObservations, setShowObservations] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [communitySpeciesKey, setCommunitySpeciesKey] = useState<string | null>(null);
  const [communityFilterOpen, setCommunityFilterOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [selectedObs, setSelectedObs] = useState<MapObservation[]>([]);
  const [zoom, setZoom] = useState(11);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [placePopupId, setPlacePopupId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const didCenterOnUser = useRef(false);
  const pendingFocus = useRef<[number, number] | null>(null);
  const zoomRef = useRef(11);
  const mapReadyRef = useRef(false);
  const myHunter = hunterFromUser(user, t("common.user"));
  const mapPoints = useMemo(() => {
    const points: MapObservation[] = [];
    const seen = new Set<string>();
    if (showObservations) {
      for (const row of myObservations) {
        seen.add(row.id);
        points.push({
          id: row.id,
          speciesName: row.speciesName,
          scientificName: row.scientificName,
          observedOn: row.observedOn,
          latitude: row.latitude,
          longitude: row.longitude,
          photoUrl: row.photoUrl,
          hunterName: myHunter,
          mine: true,
        });
      }
    }
    if (showCommunity) {
      for (const row of communityObs) {
        if (seen.has(row.id) || !matchesSpeciesFilter(row, communitySpeciesKey)) continue;
        seen.add(row.id);
        const mine = row.mine === true;
        points.push({
          id: row.id,
          speciesName: row.speciesName,
          scientificName: row.scientificName,
          observedOn: row.observedOn,
          latitude: row.latitude,
          longitude: row.longitude,
          photoUrl: row.photoUrl ?? null,
          hunterName: mine ? myHunter : row.hunterName || t("common.user"),
          mine,
        });
      }
      if (!showObservations) {
        for (const row of myObservations) {
          if (!row.isPublic || seen.has(row.id) || !matchesSpeciesFilter(row, communitySpeciesKey)) continue;
          seen.add(row.id);
          points.push({
            id: row.id,
            speciesName: row.speciesName,
            scientificName: row.scientificName,
            observedOn: row.observedOn,
            latitude: row.latitude,
            longitude: row.longitude,
            photoUrl: row.photoUrl,
            hunterName: myHunter,
            mine: true,
          });
        }
      }
    }
    return points;
  }, [showObservations, showCommunity, myObservations, communityObs, myHunter, t, communitySpeciesKey]);
  const clusters = useMemo(
    () => clusterObservations(mapPoints, zoom, bounds),
    [mapPoints, zoom, bounds],
  );
  const selectedIds = useMemo(() => new Set(selectedObs.map((row) => row.id)), [selectedObs]);
  const peekOpen = selectedObs.length > 0;
  const chromeBottom = 84 + insets.bottom;
  const communityFilterTop = insets.top + 64;
  const searchTop = showCommunity ? insets.top + 120 : insets.top + 64;
  const communitySpeciesOptions = useMemo(() => {
    const options: {
      key: string;
      mushroom: MushroomData | null;
      label: string;
      scientificName: string;
    }[] = mushrooms.map((mushroom) => ({
      key: mushroom.scientificName.trim().toLowerCase(),
      mushroom,
      label: mushroomCommonName(mushroom),
      scientificName: mushroom.scientificName,
    }));
    const catalogKeys = new Set(options.flatMap((option) => (option.mushroom ? mushroomAliases(option.mushroom) : [])));
    for (const row of [...communityObs, ...myObservations.filter((item) => item.isPublic)]) {
      const names = observationSpeciesKeys(row);
      if (names.length === 0 || names.some((name) => catalogKeys.has(name))) continue;
      const key = names[0];
      if (options.some((option) => option.key === key)) continue;
      options.push({
        key,
        mushroom: null,
        label: mushroomCommonName(row),
        scientificName: row.scientificName || row.speciesName,
      });
    }
    return options;
  }, [communityObs, myObservations, i18n.language]);
  const selectedCommunityFilter =
    communitySpeciesOptions.find((option) => option.key === communitySpeciesKey) ?? null;
  const displayedLocationPins = [
    ...placePins,
    ...(showLocations
      ? locationPins.filter((pin) => !placePins.some((row) => row.id === pin.id))
      : []),
  ];
  const selectedPlacePin = displayedLocationPins.find((pin) => pin.id === placePopupId) ?? null;
  const selectedPlaceIsSaved = selectedPlacePin
    ? locationPins.some((pin) => pin.id === selectedPlacePin.id)
    : false;

  function flyTo(coord: [number, number], duration = 800) {
    cameraRef.current?.setCamera({
      centerCoordinate: coord,
      zoomLevel: 14,
      pitch: 45,
      heading: 0,
      animationDuration: duration,
    });
  }

  function handleClusterPress(cluster: ObservationCluster) {
    setPopup(null);
    setPlacePopupId(null);
    if (!clusterIsTight(cluster, zoomRef.current)) {
      cameraRef.current?.setCamera({
        centerCoordinate: [cluster.longitude, cluster.latitude],
        zoomLevel: Math.min(zoomRef.current + 2.2, 18),
        animationDuration: 450,
      });
      return;
    }
    setSelectedObs(cluster.items);
  }

  const handleMapIdle = useCallback((state: {
    properties?: {
      zoom?: number;
      bounds?: { ne?: number[]; sw?: number[] };
    };
  }) => {
    if (!mapReadyRef.current) return;
    try {
      const nextZoomRaw = state.properties?.zoom;
      if (typeof nextZoomRaw === "number" && Number.isFinite(nextZoomRaw)) {
        const nextZoom = Math.round(nextZoomRaw * 4) / 4;
        if (Math.abs(zoomRef.current - nextZoom) >= 0.25) {
          zoomRef.current = nextZoom;
          setZoom(nextZoom);
        }
      }
      const ne = state.properties?.bounds?.ne;
      const sw = state.properties?.bounds?.sw;
      if (!ne || !sw || ne.length < 2 || sw.length < 2) return;
      const west = Math.min(sw[0], ne[0]);
      const east = Math.max(sw[0], ne[0]);
      const south = Math.min(sw[1], ne[1]);
      const north = Math.max(sw[1], ne[1]);
      const nextBounds = snapBounds({ west, south, east, north });
      setBounds((prev) => (boundsEqual(prev, nextBounds) ? prev : nextBounds));
    } catch {
      // Camera payloads can be incomplete while the style is loading.
    }
  }, []);

  const tileUrls = tileUrlsForDate(selectedMushroom, selectedDate);
  const showLayer = layerVisible && tileUrls.length > 0;

  function tryCenterOnUser(coord: [number, number]) {
    if (pendingFocus.current || didCenterOnUser.current || !cameraRef.current) return;
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

  useEffect(() => {
    const placeId = Array.isArray(params.placeId) ? params.placeId[0] : params.placeId;
    const lat = Number(Array.isArray(params.lat) ? params.lat[0] : params.lat);
    const lng = Number(Array.isArray(params.lng) ? params.lng[0] : params.lng);
    if (!placeId || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const name = Array.isArray(params.name) ? params.name[0] : params.name;
    const notes = Array.isArray(params.notes) ? params.notes[0] : params.notes;
    const pin: MapPlacePin = {
      id: placeId,
      name: name?.trim() ? name : "Location",
      notes: notes?.trim() ? notes : null,
      latitude: lat,
      longitude: lng,
      photoUrl: null,
    };
    upsertMapPlacePin(pin);
    setPlacePins(getMapPlacePins());
    setShowLocations(true);
    setPopup(null);
    setSelectedObs([]);
    setPlacePopupId(placeId);
    didCenterOnUser.current = true;
    pendingFocus.current = [lng, lat];
    flyTo([lng, lat]);
  }, [params.placeId, params.lat, params.lng, params.name, params.notes, params.ts]);

  useEffect(() => {
    if (!showLocations) {
      setLocationPins([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getTokenRef.current();
        const rows = await apiAuth<Place[]>("/api/me/places", token);
        if (cancelled) return;
        setLocationPins(
          rows
            .filter((place) => place.latitude != null && place.longitude != null)
            .map((place) => ({
              id: place.id,
              name: place.name,
              notes: place.notes,
              latitude: place.latitude as number,
              longitude: place.longitude as number,
              photoUrl: null,
            })),
        );
      } catch {
        if (!cancelled) setLocationPins([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showLocations]);

  useEffect(() => {
    if (!showObservations && !showCommunity) {
      setMyObservations([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getTokenRef.current();
        const rows = await apiAuth<Observation[]>("/api/me/observations", token);
        if (!cancelled) setMyObservations(rows);
      } catch {
        if (!cancelled) setMyObservations([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showObservations, showCommunity]);

  useEffect(() => {
    if (!showCommunity) {
      setCommunityObs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getTokenRef.current();
        const rows = await apiAuth<CommunityObservation[]>("/api/me/observations/community", token);
        if (!cancelled) setCommunityObs(Array.isArray(rows) ? rows : []);
      } catch (err) {
        console.warn("Community observations failed", err);
        if (!cancelled) setCommunityObs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showCommunity]);

  useEffect(() => {
    if (!showCommunity) setCommunityFilterOpen(false);
    setSelectedObs((prev) =>
      prev.filter((row) => {
        const onMyLayer = row.mine && showObservations;
        const onCommunityLayer = showCommunity && (!row.mine || !showObservations);
        if (onMyLayer) return true;
        if (onCommunityLayer) return matchesSpeciesFilter(row, communitySpeciesKey);
        return false;
      }),
    );
  }, [showObservations, showCommunity, communitySpeciesKey]);

  useEffect(() => {
    if (!searchOpen) return;
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        let saved: PlaceHit[] = [];
        try {
          const token = await getTokenRef.current();
          const rows = await apiAuth<Place[]>("/api/me/places", token);
          const needle = query.toLowerCase();
          saved = rows
            .filter(
              (place) =>
                place.latitude != null &&
                place.longitude != null &&
                (place.name.toLowerCase().includes(needle) ||
                  (place.notes ?? "").toLowerCase().includes(needle)),
            )
            .slice(0, 5)
            .map((place) => ({
              id: place.id,
              title: place.name,
              subtitle: t("map.savedLocation"),
              latitude: place.latitude as number,
              longitude: place.longitude as number,
              kind: "saved" as const,
              notes: place.notes,
              photoUrl: null,
            }));
        } catch (err) {
          if (!(err instanceof ApiError)) throw err;
        }
        const geo = await geocodePlaces(query, userCoord);
        if (!cancelled) setSearchResults([...saved, ...geo]);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchOpen, searchQuery, userCoord]);

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchLoading(false);
    Keyboard.dismiss();
  }

  function pickSearchHit(hit: PlaceHit) {
    if (hit.kind === "saved") {
      upsertMapPlacePin({
        id: hit.id,
        name: hit.title,
        notes: hit.notes,
        latitude: hit.latitude,
        longitude: hit.longitude,
        photoUrl: hit.photoUrl,
      });
      setPlacePins(getMapPlacePins());
      setShowLocations(true);
      setPopup(null);
      setSelectedObs([]);
      setPlacePopupId(hit.id);
    } else {
      setPlacePopupId(null);
    }
    didCenterOnUser.current = true;
    pendingFocus.current = [hit.longitude, hit.latitude];
    flyTo([hit.longitude, hit.latitude]);
    closeSearch();
  }

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
        <Text className="text-center text-[#ED8200]">{t("map.missingToken")}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0E0C" }}>
      <MapView
        style={{ flex: 1 }}
        styleURL={STYLES[mapStyle]}
        scaleBarEnabled={false}
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        onMapIdle={handleMapIdle}
        onDidFinishLoadingMap={() => {
          mapReadyRef.current = true;
          if (pendingFocus.current) {
            flyTo(pendingFocus.current, 0);
            return;
          }
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
                  setPlacePopupId(null);
                  setSelectedObs([]);
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
        {clusters.map((cluster) => (
              <MarkerView
                key={`cluster-${cluster.id}`}
                coordinate={[cluster.longitude, cluster.latitude]}
                anchor={{ x: 0.5, y: 0.5 }}
                allowOverlap
                allowOverlapWithPuck
              >
                <Pressable onPress={() => handleClusterPress(cluster)} hitSlop={8}>
                  <ClusterMark
                    cluster={cluster}
                    zoom={zoom}
                    selected={cluster.items.some((item) => selectedIds.has(item.id))}
                  />
                </Pressable>
              </MarkerView>
            ))}
        {displayedLocationPins.map((pin) => (
          <MarkerView
            key={pin.id}
            coordinate={[pin.longitude, pin.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
            allowOverlap
            allowOverlapWithPuck
          >
            <Pressable
              onPress={() => {
                setPopup(null);
                setSelectedObs([]);
                setPlacePopupId(pin.id);
              }}
              hitSlop={8}
            >
              <PlacePinMark />
            </Pressable>
          </MarkerView>
        ))}
        {selectedPlacePin ? (
          <MarkerView
            coordinate={[selectedPlacePin.longitude, selectedPlacePin.latitude]}
            anchor={{ x: 0.5, y: 1.15 }}
            allowOverlap
            allowOverlapWithPuck
          >
            <View className="w-56 overflow-hidden rounded-lg border border-[#2D5F3F] bg-[#0A0E0C]">
              <Pressable
                onPress={() => setPlacePopupId(null)}
                hitSlop={8}
                accessibilityLabel={t("common.close")}
                className="absolute right-1 top-1 z-10 h-7 w-7 items-center justify-center rounded-full bg-[#0A0E0C]/80"
              >
                <X color="#F5F5F0" size={16} strokeWidth={2.5} />
              </Pressable>
              {selectedPlacePin.photoUrl ? (
                <Image
                  source={{ uri: selectedPlacePin.photoUrl }}
                  className="h-28 w-full"
                />
              ) : null}
              <View className={`items-center px-3 py-2 ${selectedPlacePin.photoUrl ? "" : "pr-8"}`}>
                <Text className="text-center font-semibold text-[#F5F5F0]">{selectedPlacePin.name}</Text>
                {selectedPlacePin.notes ? (
                  <Text className="mt-1 text-center text-xs text-[#9CA89F]">{selectedPlacePin.notes}</Text>
                ) : null}
                {selectedPlaceIsSaved ? null : (
                  <Pressable
                    onPress={() => {
                      removeMapPlacePin(selectedPlacePin.id);
                      setPlacePins(getMapPlacePins());
                      setPlacePopupId(null);
                    }}
                  >
                    <Text className="mt-2 text-xs font-medium text-[#ED8200]">{t("map.removePin")}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </MarkerView>
        ) : null}
        {popup ? (
          <MarkerView coordinate={[popup.longitude, popup.latitude]} allowOverlap>
            <View className="items-center rounded-lg border border-[#2D5F3F] bg-[#0A0E0C] px-3 py-2">
              <Text className="font-semibold text-[#F5F5F0]">
                {t("map.probability", { value: (popup.prediction * 100).toFixed(1) })}
              </Text>
              <Pressable
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps?q=${popup.latitude.toFixed(6)},${popup.longitude.toFixed(6)}`
                  )
                }
              >
                <Text className="mt-1 text-sm text-[#4A7C5D]">{t("map.openInMaps")}</Text>
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
                <Text className="mt-1 text-sm text-[#4A7C5D]">{t("map.showStats")}</Text>
              </Pressable>
              <Pressable onPress={() => setPopup(null)}>
                <Text className="mt-1 text-xs text-[#9CA89F]">{t("common.close")}</Text>
              </Pressable>
            </View>
          </MarkerView>
        ) : null}
      </MapView>

      <View
        className="absolute left-4 right-4 flex-row items-center rounded-full border border-[#2D5F3F]/40 bg-[#1B3022]/90"
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          top: insets.top + 8,
          zIndex: 1,
          elevation: 8,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityLabel={t("menu.openMenu")}
          className="h-12 w-12 items-center justify-center"
        >
          <Menu color="#F5F5F0" size={22} strokeWidth={2} />
        </Pressable>
        <View className="h-8 w-px bg-white/20" />
        <Pressable
          onPress={() => setPickerOpen(true)}
          className="min-w-0 flex-1 flex-row items-center gap-2 py-1.5 pl-2 pr-1"
        >
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-[#0A0E0C]/80">
            <MushroomIcon
              name={selectedMushroom.name}
              scientificName={selectedMushroom.scientificName}
              id={selectedMushroom.id}
              size={22}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-semibold text-[#F5F5F0]" numberOfLines={1}>
              {mushroomCommonName(selectedMushroom)}
            </Text>
            <Text className="text-xs italic text-[#9CA89F]" numberOfLines={1}>
              {selectedMushroom.scientificName}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => {
            setLayerVisible((v) => !v);
            setPopup(null);
          }}
          accessibilityLabel={layerVisible ? t("map.hideLayer") : t("map.showLayer")}
          className="h-12 w-11 items-center justify-center pr-2"
        >
          {layerVisible ? (
            <Eye color="#F5F5F0" size={20} />
          ) : (
            <EyeOff color="#9CA89F" size={20} />
          )}
        </Pressable>
      </View>

      {showCommunity ? (
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: communityFilterTop,
            zIndex: 3,
            elevation: 12,
          }}
        >
          <Pressable
            onPress={() => setCommunityFilterOpen((open) => !open)}
            accessibilityLabel={t("map.filterCommunitySpecies")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(45,95,63,0.4)",
              backgroundColor: "rgba(27,48,34,0.95)",
              paddingLeft: 12,
              paddingRight: 14,
              minHeight: 48,
            }}
          >
            <View
              style={{
                height: 32,
                width: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                backgroundColor: "rgba(10,14,12,0.8)",
              }}
            >
              {selectedCommunityFilter?.mushroom ? (
                <MushroomIcon
                  name={selectedCommunityFilter.mushroom.name}
                  scientificName={selectedCommunityFilter.mushroom.scientificName}
                  id={selectedCommunityFilter.mushroom.id}
                  size={20}
                />
              ) : (
                <Leaf color="#4A7C5D" size={18} />
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#F5F5F0" }} numberOfLines={1}>
                {selectedCommunityFilter ? selectedCommunityFilter.label : t("map.allSpecies")}
              </Text>
              {selectedCommunityFilter ? (
                <Text style={{ fontSize: 11, fontStyle: "italic", color: "#9CA89F" }} numberOfLines={1}>
                  {selectedCommunityFilter.scientificName}
                </Text>
              ) : (
                <Text style={{ fontSize: 11, color: "#9CA89F" }} numberOfLines={1}>
                  {t("map.filterCommunitySpecies")}
                </Text>
              )}
            </View>
            <ChevronDown color="#F5F5F0" size={18} />
          </Pressable>
          {communityFilterOpen ? (
            <View
              style={{
                marginTop: 8,
                maxHeight: 280,
                overflow: "hidden",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(45,95,63,0.4)",
                backgroundColor: "rgba(10,14,12,0.96)",
              }}
            >
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                <Pressable
                  onPress={() => {
                    setCommunitySpeciesKey(null);
                    setCommunityFilterOpen(false);
                    setSelectedObs([]);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: communitySpeciesKey == null ? "#2D5F3F" : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#F5F5F0" }}>{t("map.allSpecies")}</Text>
                </Pressable>
                {communitySpeciesOptions.map((option) => {
                  const active = option.key === communitySpeciesKey;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => {
                        setCommunitySpeciesKey(option.key);
                        setCommunityFilterOpen(false);
                        setSelectedObs([]);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        backgroundColor: active ? "#2D5F3F" : "transparent",
                      }}
                    >
                      <View
                        style={{
                          height: 32,
                          width: 32,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                          backgroundColor: "#1B3022",
                        }}
                      >
                        {option.mushroom ? (
                          <MushroomIcon
                            name={option.mushroom.name}
                            scientificName={option.mushroom.scientificName}
                            id={option.mushroom.id}
                          />
                        ) : (
                          <Leaf color="#4A7C5D" size={16} />
                        )}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: "#F5F5F0" }} numberOfLines={1}>
                          {option.label}
                        </Text>
                        <Text style={{ fontSize: 11, fontStyle: "italic", color: "#9CA89F" }} numberOfLines={1}>
                          {option.scientificName}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : null}

      {searchOpen ? (
        <View
          className="absolute left-4 right-4"
          style={{ position: "absolute", left: 16, right: 16, top: searchTop, zIndex: 2, elevation: 10 }}
        >
          <View className="flex-row items-center rounded-full border border-[#2D5F3F]/40 bg-[#1B3022]/95 px-3">
            <Search color="#9CA89F" size={18} />
            <TextInput
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("map.searchPlaces")}
              placeholderTextColor="#6B7B6E"
              className="ml-2 flex-1 py-2.5 text-[#F5F5F0]"
              returnKeyType="search"
            />
            {searchLoading ? <ActivityIndicator color="#4A7C5D" className="mr-1" /> : null}
            <Pressable onPress={closeSearch} hitSlop={8} accessibilityLabel={t("common.close")}>
              <X color="#F5F5F0" size={18} />
            </Pressable>
          </View>
          {searchQuery.trim().length >= 2 ? (
            <View className="mt-2 max-h-64 overflow-hidden rounded-xl border border-[#2D5F3F]/40 bg-[#0A0E0C]/95">
              {searchResults.length === 0 && !searchLoading ? (
                <Text className="px-4 py-3 text-sm text-[#9CA89F]">{t("map.noPlacesFound")}</Text>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                  {searchResults.map((hit) => (
                    <Pressable
                      key={`${hit.kind}-${hit.id}`}
                      onPress={() => pickSearchHit(hit)}
                      className="border-b border-white/10 px-4 py-3"
                    >
                      <Text className="text-sm font-medium text-[#F5F5F0]" numberOfLines={1}>
                        {hit.title}
                      </Text>
                      {hit.subtitle ? (
                        <Text className="mt-0.5 text-xs text-[#9CA89F]" numberOfLines={1}>
                          {hit.subtitle}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : null}
        </View>
      ) : null}

      <View
        className="absolute overflow-hidden rounded-full border border-[#2D5F3F]/50 bg-[#0A0E0C]/90"
        style={{
          position: "absolute",
          right: 16,
          bottom: chromeBottom,
          zIndex: 4,
          elevation: 14,
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Pressable
          onPress={() => {
            setCommunityFilterOpen(false);
            setLayersOpen((open) => !open);
          }}
          accessibilityLabel={t("map.openLayers")}
          className={`h-12 w-12 items-center justify-center ${
            layersOpen || mapStyle === "satellite" ? "bg-[#2D5F3F]" : ""
          }`}
        >
          {mapStyle === "satellite" ? (
            <Satellite color="#F5F5F0" size={22} />
          ) : (
            <Map color="#F5F5F0" size={22} />
          )}
        </Pressable>
        <View className="mx-2.5 h-px bg-white/15" />
        <Pressable
          onPress={handleGeolocate}
          accessibilityLabel={t("map.goToMyLocation")}
          className="h-12 w-12 items-center justify-center"
        >
          <Locate color="#F5F5F0" size={22} />
        </Pressable>
        <View className="mx-2.5 h-px bg-white/15" />
        <Pressable
          onPress={handleCompass}
          accessibilityLabel={t("map.resetCompass")}
          className="h-12 w-12 items-center justify-center"
        >
          <Compass color="#F5F5F0" size={22} />
        </Pressable>
        <View className="mx-2.5 h-px bg-white/15" />
        <Pressable
          onPress={() => {
            setCommunityFilterOpen(false);
            if (searchOpen) closeSearch();
            else setSearchOpen(true);
          }}
          accessibilityLabel={t("map.search")}
          className={`h-12 w-12 items-center justify-center ${searchOpen ? "bg-[#2D5F3F]" : ""}`}
        >
          <Search color="#F5F5F0" size={22} />
        </Pressable>
      </View>

      <Modal visible={layersOpen} transparent animationType="fade">
        <View className="flex-1 items-end justify-end p-4" style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end", backgroundColor: "rgba(0,0,0,0.4)", padding: 16, paddingBottom: chromeBottom }}>
          <Pressable className="absolute inset-0" onPress={() => setLayersOpen(false)} />
          <View style={{ marginRight: 52 }}>
            <MapLayersPanel
              mapStyle={mapStyle}
              onMapStyle={setMapStyle}
              showLocations={showLocations}
              onShowLocations={setShowLocations}
              showObservations={showObservations}
              onShowObservations={setShowObservations}
              showCommunity={showCommunity}
              onShowCommunity={setShowCommunity}
            />
          </View>
        </View>
      </Modal>

      {mapError ? (
        <View className="absolute left-4 right-4 top-1/3 rounded-xl border border-[#5E0000] bg-[#0A0E0C]/95 p-3">
          <Text className="text-sm text-[#ED8200]">{t("map.failedToLoad")}</Text>
          <Text className="mt-1 text-xs text-[#9CA89F]">{mapError}</Text>
        </View>
      ) : null}
      {locationError ? (
        <View className="absolute bottom-28 left-4 right-4 rounded-xl bg-[#0A0E0C]/90 p-3" style={{ bottom: 112 + insets.bottom }}>
          <Text className="text-sm text-[#ED8200]">{locationError}</Text>
        </View>
      ) : null}

      {peekOpen ? (
        <ObservationPeek
          items={selectedObs}
          bottom={chromeBottom + 8}
          right={72}
          onClose={() => setSelectedObs([])}
          onOpen={(item) => {
            if (item.mine) router.push(`/observations/${item.id}`);
            else router.push(`/observations/community/${item.id}`);
          }}
        />
      ) : null}

      <View
        className="absolute bottom-0 left-0 right-0 bg-[#0A0E0C]"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#0A0E0C", paddingBottom: insets.bottom }}
      >
        <View className="flex-row border-b border-white/10 bg-black/60" style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.6)" }}>
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
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 8,
                backgroundColor: selectedDate === dateObj.fullDate ? "rgba(255,255,255,0.2)" : "transparent",
              }}
            >
              <Text className="text-[11px] font-medium uppercase tracking-wide text-[#F5F5F0]">
                {dateObj.isToday
                  ? t("map.today")
                  : dateObj.date.toLocaleDateString(dateLocale(i18n.language), { weekday: "short" })}
              </Text>
              <Text className="text-sm font-medium text-[#F5F5F0]">{dateObj.dayNumber}</Text>
            </Pressable>
          ))}
        </View>
        <View className="h-6 w-full justify-center" style={{ height: 24, width: "100%", justifyContent: "center" }}>
          <LinearGradient
            colors={["#5E0000", "#ED8200", "#FFE500", "#00DE1A", "#004D1B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View
            className="h-6 w-full flex-row items-center justify-between px-[22px]"
            style={{ height: 24, width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22 }}
          >
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
              <Text className="text-lg font-semibold text-[#F5F5F0]">{t("map.selectMushroom")}</Text>
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
                    <Text className="text-sm font-semibold text-[#F5F5F0]">{mushroomCommonName(mushroom)}</Text>
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

import { useRef, useCallback, useEffect, useState } from "react";
import Map from "react-map-gl";
import mapboxgl from "mapbox-gl";
import { useDashboard } from "../../context/dashboard-context";
import { MushroomPopup } from "./MushroomPopup";

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
if (mapboxToken) {
  mapboxgl.accessToken = mapboxToken;
}

const mushroomLayerPaint: mapboxgl.FillPaint = {
  "fill-color": [
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
  ],
  "fill-opacity": 0.6,
};

export function MapContainer() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { state, dispatch, mapStyles, getCurrentTileUrl } = useDashboard();
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    prediction: number;
  } | null>(null);

  const enable3DTerrain = useCallback((map: mapboxgl.Map) => {
    try {
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
      if (!map.getLayer("sky")) {
        map.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0.0, 0.0],
            "sky-atmosphere-sun-intensity": 15,
          },
        });
      }
    } catch (e) {
      console.warn("Error enabling 3D terrain:", e);
    }
  }, []);

  const onMapLoad = useCallback(
    (ev: { target: mapboxgl.Map }) => {
      const map = ev.target;
      dispatch({ type: "SET_MAP", payload: map });
      dispatch({ type: "SET_MAP_LOADED", payload: true });
      enable3DTerrain(map);
    },
    [dispatch, enable3DTerrain]
  );

  useEffect(() => {
    const map = state.map;
    if (!map) return;
    const onStyleLoad = () => enable3DTerrain(map);
    map.on("style.load", onStyleLoad);
    return () => map.off("style.load", onStyleLoad);
  }, [state.map, enable3DTerrain]);

  const onClick = useCallback(
    (ev: { features?: Array<{ layer?: { id?: string }; properties?: { species_prediction?: number } }>; lngLat: { lng: number; lat: number } }) => {
      const { features, lngLat } = ev;
      if (!state.showMushroomLayer || !state.layerVisible) {
        setPopupInfo(null);
        return;
      }
      const mushroomFeature = features?.find((f) =>
        f.layer?.id?.startsWith("mushroom-fill")
      );
      if (
        mushroomFeature?.properties?.species_prediction !== undefined
      ) {
        setPopupInfo({
          longitude: lngLat.lng,
          latitude: lngLat.lat,
          prediction: mushroomFeature.properties.species_prediction,
        });
      } else {
        setPopupInfo(null);
      }
    },
    [state.showMushroomLayer, state.layerVisible]
  );

  useEffect(() => {
    if (!state.showMushroomLayer || !state.layerVisible) setPopupInfo(null);
  }, [state.showMushroomLayer, state.layerVisible]);

  const currentTileUrls = getCurrentTileUrl(state.selectedDate);
  const hasTiles = currentTileUrls && currentTileUrls.length > 0;
  const interactiveLayerIds = hasTiles
    ? currentTileUrls.map((_, idx) => `mushroom-fill-${idx}`)
    : [];

  // Match old implementation: one Source per tile URL, each with fill + outline layer (added imperatively for "source-layer")
  useEffect(() => {
    const map = state.map;
    if (!map || !state.isMapLoaded) return;

    const shouldShow =
      state.showMushroomLayer && state.layerVisible && hasTiles;
    const tileUrls = currentTileUrls ?? [];

    const removeLayersForIndices = (count: number) => {
      for (let idx = 0; idx < count; idx++) {
        try {
          const outlineId = `mushroom-outline-${idx}`;
          const fillId = `mushroom-fill-${idx}`;
          const sourceId = `mushroom-polygons-${idx}`;
          if (map.getLayer(outlineId)) map.removeLayer(outlineId);
          if (map.getLayer(fillId)) map.removeLayer(fillId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch {
          // already removed or style changed
        }
      }
    };

    const addLayers = () => {
      if (!shouldShow || tileUrls.length === 0) return;
      try {
        removeLayersForIndices(tileUrls.length);
        tileUrls.forEach((url, idx) => {
          const sourceId = `mushroom-polygons-${idx}`;
          const fillId = `mushroom-fill-${idx}`;
          const outlineId = `mushroom-outline-${idx}`;
          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
              type: "vector",
              tiles: [url],
              minzoom: 10,
              maxzoom: 14,
            });
          }
          if (!map.getLayer(fillId)) {
            map.addLayer({
              id: fillId,
              type: "fill",
              source: sourceId,
              "source-layer": "predictions",
              paint: mushroomLayerPaint,
            });
          }
          if (!map.getLayer(outlineId)) {
            map.addLayer({
              id: outlineId,
              type: "line",
              source: sourceId,
              "source-layer": "predictions",
              paint: {
                "line-color": "#000",
                "line-width": 1,
                "line-opacity": 0.1,
              },
            });
          }
        });
      } catch (e) {
        console.warn("MapContainer: addLayers failed", e);
      }
    };

    const MAX_SOURCES = 10;
    const removeAllMushroomLayers = () => removeLayersForIndices(MAX_SOURCES);

    if (!shouldShow) {
      removeAllMushroomLayers();
      return;
    }

    // Re-add layers when style is ready or when user switches style
    const onStyleLoad = () => {
      if (shouldShow && tileUrls.length > 0) requestAnimationFrame(addLayers);
    };
    map.on("style.load", onStyleLoad);

    // Run addLayers when style is already loaded (tile URLs arrived after map ready)
    if (map.isStyleLoaded()) {
      requestAnimationFrame(() => requestAnimationFrame(addLayers));
    }

    // Fallback: ensure layers are added even if we missed style.load (e.g. style loaded before we subscribed)
    const fallbackId = window.setTimeout(() => {
      if (tileUrls.length > 0) {
        try {
          if (map.isStyleLoaded()) addLayers();
        } catch {
          // no-op
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(fallbackId);
      map.off("style.load", onStyleLoad);
      removeAllMushroomLayers();
    };
  }, [
    state.map,
    state.isMapLoaded,
    state.showMushroomLayer,
    state.layerVisible,
    hasTiles,
    state.selectedDate,
    state.tileUrls.today,
    state.tileUrls.tomorrow,
    state.tileUrls.later,
  ]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 11.3285,
          latitude: 43.3188,
          zoom: 11,
          pitch: 45,
          bearing: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyles[state.currentMapStyle]}
        onLoad={onMapLoad}
        onClick={onClick}
        interactiveLayerIds={interactiveLayerIds}
        attributionControl={false}
        logoPosition="bottom-right"
        antialias={false}
      >
        {popupInfo && (
          <MushroomPopup
            key={`${popupInfo.longitude}-${popupInfo.latitude}`}
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            prediction={popupInfo.prediction}
            onClose={() => setPopupInfo(null)}
          />
        )}
      </Map>
    </div>
  );
}

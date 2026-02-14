import { useRef, useCallback, useEffect, useState } from "react";
import Map, { Source, Layer } from "react-map-gl";
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
  const interactiveLayerIds = hasTiles ? ["mushroom-fill"] : [];

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
        {/* Single vector source with all tile URLs, same as old app */}
        {state.showMushroomLayer && state.layerVisible && hasTiles && (
          <Source
            id="mushroom-polygons"
            type="vector"
            tiles={currentTileUrls}
            minzoom={10}
            maxzoom={14}
          >
            <Layer
              id="mushroom-fill"
              type="fill"
              paint={mushroomLayerPaint}
              {...{ "source-layer": "predictions" }}
            />
            <Layer
              id="mushroom-outline"
              type="line"
              paint={{
                "line-color": "#000",
                "line-width": 1,
                "line-opacity": 0.1,
              }}
              {...{ "source-layer": "predictions" }}
            />
          </Source>
        )}
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

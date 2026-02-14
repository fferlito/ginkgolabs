import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import { format, addDays, startOfDay } from "date-fns";
import type { Map as MapboxMap } from "mapbox-gl";
import { loadMushroomData } from "../services/mushroomService";
import type { MushroomData } from "../data/mushrooms/types";

export interface DashboardTileUrls {
  today: string[];
  tomorrow: string[];
  later: string[];
}

export interface DashboardState {
  selectedDate: string;
  currentMapStyle: "custom" | "satellite";
  layerVisible: boolean;
  showMushroomLayer: boolean;
  showMushroomSelection: boolean;
  mushrooms: MushroomData[];
  selectedMushroom: MushroomData | null;
  tileUrls: DashboardTileUrls;
  map: MapboxMap | null;
  isMapLoaded: boolean;
  isLoadingTileUrls: boolean;
  isLoadingMushroomData: boolean;
}

const today = startOfDay(new Date());
const initialDate = format(today, "yyyy-MM-dd");

const initialState: DashboardState = {
  selectedDate: initialDate,
  currentMapStyle: "custom",
  layerVisible: true,
  showMushroomLayer: true,
  showMushroomSelection: false,
  mushrooms: [],
  selectedMushroom: null,
  tileUrls: { today: [], tomorrow: [], later: [] },
  map: null,
  isMapLoaded: false,
  isLoadingTileUrls: false,
  isLoadingMushroomData: true,
};

type DashboardAction =
  | { type: "TOGGLE_MUSHROOM_SELECTION" }
  | { type: "SET_MUSHROOM_DATA"; payload: { allMushrooms: MushroomData[]; defaultMushroom: MushroomData } }
  | { type: "SET_SELECTED_MUSHROOM"; payload: MushroomData }
  | { type: "SET_SELECTED_DATE"; payload: string }
  | { type: "SET_MAP_STYLE"; payload: "custom" | "satellite" }
  | { type: "TOGGLE_LAYER_VISIBILITY" }
  | { type: "SET_LAYER_VISIBILITY"; payload: boolean }
  | { type: "SET_MAP"; payload: MapboxMap | null }
  | { type: "SET_MAP_LOADED"; payload: boolean }
  | { type: "UPDATE_TILE_URLS"; payload: Partial<DashboardTileUrls> }
  | { type: "SET_LOADING_TILE_URLS"; payload: boolean }
  | { type: "TOGGLE_MUSHROOM_LAYER" }
  | { type: "SET_MUSHROOM_LAYER"; payload: boolean };

function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case "TOGGLE_MUSHROOM_SELECTION":
      return { ...state, showMushroomSelection: !state.showMushroomSelection };
    case "SET_MUSHROOM_DATA":
      return {
        ...state,
        mushrooms: action.payload.allMushrooms,
        selectedMushroom: action.payload.defaultMushroom,
        tileUrls: action.payload.defaultMushroom.tileUrls,
        isLoadingMushroomData: false,
      };
    case "SET_SELECTED_MUSHROOM":
      return {
        ...state,
        selectedMushroom: action.payload,
        tileUrls: action.payload.tileUrls,
        showMushroomSelection: false,
      };
    case "SET_SELECTED_DATE":
      return { ...state, selectedDate: action.payload };
    case "SET_MAP_STYLE":
      return { ...state, currentMapStyle: action.payload };
    case "TOGGLE_LAYER_VISIBILITY":
      return { ...state, layerVisible: !state.layerVisible };
    case "SET_LAYER_VISIBILITY":
      return { ...state, layerVisible: action.payload };
    case "SET_MAP":
      return { ...state, map: action.payload };
    case "SET_MAP_LOADED":
      return { ...state, isMapLoaded: action.payload };
    case "UPDATE_TILE_URLS":
      return { ...state, tileUrls: { ...state.tileUrls, ...action.payload } };
    case "SET_LOADING_TILE_URLS":
      return { ...state, isLoadingTileUrls: action.payload };
    case "TOGGLE_MUSHROOM_LAYER":
      return { ...state, showMushroomLayer: !state.showMushroomLayer };
    case "SET_MUSHROOM_LAYER":
      return { ...state, showMushroomLayer: action.payload };
    default:
      return state;
  }
}

const mapStyles: Record<"custom" | "satellite", string> = {
  custom: "mapbox://styles/ferlixxx/cm8xkvecy000o01s6fy1h60qi",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

interface DashboardContextValue {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  mapStyles: typeof mapStyles;
  getCurrentTileUrl: (selectedDate: string) => string[];
}

const DashboardContext = createContext<DashboardContextValue | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  useEffect(() => {
    loadMushroomData()
      .then(({ allMushrooms, defaultMushroom }) => {
        dispatch({
          type: "SET_MUSHROOM_DATA",
          payload: { allMushrooms, defaultMushroom },
        });
      })
      .catch((err) => {
        console.error("Failed to load mushroom data:", err);
      });
  }, []);

  const getCurrentTileUrl = (selectedDate: string): string[] => {
    const now = startOfDay(new Date());
    const todayStr = format(now, "yyyy-MM-dd");
    const tomorrowStr = format(addDays(now, 1), "yyyy-MM-dd");
    if (selectedDate === todayStr) return state.tileUrls.today;
    if (selectedDate === tomorrowStr) return state.tileUrls.tomorrow;
    return state.tileUrls.later;
  };

  return (
    <DashboardContext.Provider
      value={{ state, dispatch, mapStyles, getCurrentTileUrl }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (ctx === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}

import "../global.css";
import "../lib/i18n";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { NavigationBar } from "expo-navigation-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, AppState, Platform, View } from "react-native";
import { hydrateLanguage } from "../lib/i18n";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

const stackOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: "#0A0E0C" },
} as const;

function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    const route = segments[0];
    const onAuthScreen = route === "login" || route === "register";
    if (!isSignedIn && !onAuthScreen) {
      router.replace("/login");
    } else if (isSignedIn && onAuthScreen) {
      router.replace("/map");
    }
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0A0E0C]">
        <ActivityIndicator color="#4A7C5D" size="large" />
      </View>
    );
  }

  return <Stack screenOptions={stackOptions} />;
}

function useHiddenAndroidNavBar() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const hide = () => {
      NavigationBar.setStyle("light");
      NavigationBar.setHidden(true);
    };
    hide();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") hide();
    });
    return () => sub.remove();
  }, []);
}

export default function RootLayout() {
  useHiddenAndroidNavBar();
  useEffect(() => {
    void hydrateLanguage();
  }, []);
  return (
    <>
      <StatusBar style="light" />
      {Platform.OS === "android" ? <NavigationBar hidden style="light" /> : null}
      {publishableKey ? (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <AuthGate />
        </ClerkProvider>
      ) : (
        <Stack screenOptions={stackOptions} />
      )}
    </>
  );
}

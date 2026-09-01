import { useClerk } from "@clerk/expo";
import { useSSO } from "@clerk/expo/experimental";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_REDIRECT_URL = "clerk://com.mushroomradar.app.callback";

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.5 7.4l6.2 5.2C37.9 38.3 44 32.5 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </Svg>
  );
}

export function GoogleSignInButton({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const { setActive } = useClerk();
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  async function onPress() {
    setLoading(true);
    onError("");
    try {
      const { createdSessionId, authSessionResult, signUp } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: GOOGLE_REDIRECT_URL,
      });
      if (authSessionResult?.type === "cancel" || authSessionResult?.type === "dismiss") {
        return;
      }
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        return;
      }
      if (signUp?.status === "missing_requirements") {
        onError("Google sign-in needs extra account details in Clerk before it can finish.");
        return;
      }
      onError("Google sign-in did not complete. Enable Google in the Clerk dashboard.");
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Google sign-in failed.";
      if (message.toLowerCase().includes("cancel")) return;
      onError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="mb-6 flex-row items-center justify-center gap-3 rounded-xl border border-[#2D5F3F] bg-[#1B3022] py-3 active:bg-[#2D5F3F]"
    >
      {loading ? (
        <ActivityIndicator color="#F5F5F0" />
      ) : (
        <>
          <GoogleMark />
          <Text className="text-base font-semibold text-[#F5F5F0]">Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

export function AuthDivider() {
  return (
    <View className="mb-6 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-[#2D5F3F]/50" />
      <Text className="text-xs uppercase tracking-wider text-[#9CA89F]">or</Text>
      <View className="h-px flex-1 bg-[#2D5F3F]/50" />
    </View>
  );
}

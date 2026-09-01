import { useSignIn } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { AuthDivider, GoogleSignInButton } from "../components/google-sign-in";

function MissingClerkKey() {
  return (
    <View className="flex-1 items-center justify-center bg-[#0A0E0C] px-6">
      <Text className="text-center text-[#9CA89F]">
        Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to mobile_app/.env to enable sign-in.
      </Text>
    </View>
  );
}

export default function LoginScreen() {
  if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <MissingClerkKey />;
  }
  return <LoginForm />;
}

function LoginForm() {
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerify, setPendingVerify] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loading = fetchStatus === "fetching";
  const emailReady = emailAddress.trim().length > 0;

  async function finalizeIfComplete() {
    if (signIn.status !== "complete") {
      setFormError(`Sign-in is not complete (status: ${signIn.status}).`);
      return;
    }
    await signIn.finalize({
      navigate: () => {
        router.replace("/map");
      },
    });
  }

  async function onSendEmail() {
    setFormError(null);
    if (!emailReady) {
      setFormError("Enter your email to receive a login email.");
      return;
    }
    const { error } = await signIn.emailCode.sendCode({
      emailAddress: emailAddress.trim(),
    });
    if (error) {
      setFormError(
        errors.fields.identifier?.message ||
          errors.fields.emailAddress?.message ||
          error.message ||
          JSON.stringify(error)
      );
      return;
    }
    setPendingVerify(true);
  }

  async function onVerify() {
    setFormError(null);
    const { error } = await signIn.emailCode.verifyCode({ code });
    if (error) {
      setFormError(errors.fields.code?.message || error.message || JSON.stringify(error));
      return;
    }
    await finalizeIfComplete();
  }

  async function onStartOver() {
    setFormError(null);
    setCode("");
    setPendingVerify(false);
    await signIn.reset();
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0E0C]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="mb-1 text-3xl font-semibold text-[#F5F5F0]">
          Mushroom<Text className="text-[#4A7C5D]">Radar</Text>
        </Text>
        <Text className="mb-8 text-base text-[#9CA89F]">
          {pendingVerify
            ? `We sent a login email to ${emailAddress.trim()}`
            : "Sign in to open the map"}
        </Text>

        {!pendingVerify ? (
          <>
            <GoogleSignInButton onError={(message) => setFormError(message || null)} />
            <AuthDivider />
            <Text className="mb-2 text-sm text-[#9CA89F]">Email</Text>
            <TextInput
              className="mb-4 rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3 text-[#F5F5F0]"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#6B7B6E"
              value={emailAddress}
              onChangeText={setEmailAddress}
            />
          </>
        ) : (
          <>
            <Text className="mb-2 text-sm text-[#9CA89F]">Login code</Text>
            <TextInput
              className="mb-4 rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3 text-[#F5F5F0]"
              keyboardType="number-pad"
              placeholder="123456"
              placeholderTextColor="#6B7B6E"
              value={code}
              onChangeText={setCode}
            />
          </>
        )}

        {formError ? (
          <Text className="mb-4 text-sm text-[#ED8200]">{formError}</Text>
        ) : null}

        <Pressable
          className="mb-4 items-center rounded-xl bg-[#2D5F3F] py-3 active:bg-[#4A7C5D]"
          disabled={loading || (!pendingVerify && !emailReady)}
          onPress={pendingVerify ? onVerify : onSendEmail}
        >
          {loading ? (
            <ActivityIndicator color="#F5F5F0" />
          ) : (
            <Text className="text-base font-semibold text-[#F5F5F0]">
              {pendingVerify ? "Verify" : "Send login email"}
            </Text>
          )}
        </Pressable>

        {pendingVerify ? (
          <View className="mb-6 gap-3">
            <Pressable disabled={loading} onPress={onSendEmail}>
              <Text className="text-center text-[#4A7C5D]">Resend email</Text>
            </Pressable>
            <Pressable disabled={loading} onPress={onStartOver}>
              <Text className="text-center text-[#9CA89F]">Use a different email</Text>
            </Pressable>
          </View>
        ) : (
          <Link href="/register" asChild>
            <Pressable>
              <Text className="text-center text-[#9CA89F]">
                No account? <Text className="text-[#4A7C5D]">Register</Text>
              </Text>
            </Pressable>
          </Link>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

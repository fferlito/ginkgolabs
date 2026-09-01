import { useSignUp } from "@clerk/expo";
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
        Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to mobile_app/.env to enable registration.
      </Text>
    </View>
  );
}

export default function RegisterScreen() {
  if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <MissingClerkKey />;
  }
  return <RegisterForm />;
}

function RegisterForm() {
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerify, setPendingVerify] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loading = fetchStatus === "fetching";
  const emailReady = emailAddress.trim().length > 0;

  async function onRegister() {
    setFormError(null);
    if (!emailReady) {
      setFormError("Enter your email to receive a login email.");
      return;
    }
    const { error } = await signUp.create({ emailAddress: emailAddress.trim() });
    if (error) {
      setFormError(
        errors.fields.emailAddress?.message || error.message || JSON.stringify(error)
      );
      return;
    }
    if (signUp.status === "complete") {
      await signUp.finalize();
      router.replace("/map");
      return;
    }
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setFormError(sendError.message || JSON.stringify(sendError));
      return;
    }
    setPendingVerify(true);
  }

  async function onVerify() {
    setFormError(null);
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      setFormError(errors.fields.code?.message || error.message || JSON.stringify(error));
      return;
    }
    if (signUp.status === "complete") {
      await signUp.finalize();
      router.replace("/map");
      return;
    }
    setFormError(`Sign-up is not complete (status: ${signUp.status}).`);
  }

  async function onStartOver() {
    setFormError(null);
    setCode("");
    setPendingVerify(false);
    await signUp.reset();
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0E0C]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="mb-1 text-3xl font-semibold text-[#F5F5F0]">Create account</Text>
        <Text className="mb-8 text-base text-[#9CA89F]">
          {pendingVerify
            ? `We sent a login email to ${emailAddress.trim()}`
            : "Register to open the map"}
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
          onPress={pendingVerify ? onVerify : onRegister}
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
            <Pressable disabled={loading} onPress={() => signUp.verifications.sendEmailCode()}>
              <Text className="text-center text-[#4A7C5D]">Resend email</Text>
            </Pressable>
            <Pressable disabled={loading} onPress={onStartOver}>
              <Text className="text-center text-[#9CA89F]">Use a different email</Text>
            </Pressable>
          </View>
        ) : (
          <Link href="/login" asChild>
            <Pressable>
              <Text className="text-center text-[#9CA89F]">
                Already have an account? <Text className="text-[#4A7C5D]">Sign in</Text>
              </Text>
            </Pressable>
          </Link>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

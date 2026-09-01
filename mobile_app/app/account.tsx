import { useUser } from "@clerk/expo";
import { ScrollView, Text, View } from "react-native";
import { Subpage } from "../components/subpage";

function ProfileCard({
  displayName,
  email,
  initials,
}: {
  displayName: string;
  email: string;
  initials: string;
}) {
  return (
    <View className="mx-4 rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6">
      <Text className="mb-4 text-lg font-semibold text-[#4A7C5D]">Profile</Text>
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white/10">
        <Text className="text-xl font-medium text-[#A0AEC0]">{initials}</Text>
      </View>
      <Text className="text-sm text-[#9CA89F]">Name</Text>
      <Text className="mb-3 text-base text-[#F5F5F0]">{displayName}</Text>
      <Text className="text-sm text-[#9CA89F]">Email</Text>
      <Text className="text-base text-[#F5F5F0]">{email}</Text>
      <Text className="mt-4 text-sm text-[#9CA89F]">
        Profile details are managed by your account provider.
      </Text>
    </View>
  );
}

function ClerkAccount() {
  const { user } = useUser();
  const displayName =
    user?.firstName || user?.lastName
      ? [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User"
      : "User";
  const email = user?.primaryEmailAddress?.emailAddress ?? "user@example.com";
  const initials =
    user?.firstName?.[0] && user?.lastName?.[0]
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : (user?.firstName?.[0] ?? email[0] ?? "?").toUpperCase();
  return <ProfileCard displayName={displayName} email={email} initials={initials} />;
}

export default function AccountScreen() {
  const hasClerk = !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <Subpage title="Account">
      <ScrollView>
        {hasClerk ? (
          <ClerkAccount />
        ) : (
          <ProfileCard displayName="Guest" email="—" initials="G" />
        )}
      </ScrollView>
    </Subpage>
  );
}

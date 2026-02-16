import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

function ProfileFields({
  displayName = "User",
  email = "user@example.com",
  initials = "?",
}: {
  displayName?: string;
  email?: string;
  initials?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-6">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#2D5F3F]/50 text-[#F5F5F0] text-2xl font-medium">
        {initials.toUpperCase().slice(0, 2)}
      </div>
      <div className="flex-1 space-y-4 min-w-0">
        <div className="space-y-2">
          <Label htmlFor="profile-name" className="text-[#9CA89F]">
            Name
          </Label>
          <Input
            id="profile-name"
            defaultValue={displayName}
            className="bg-[#0A0E0C]/60 border-[#2D5F3F]/30 text-[#F5F5F0]"
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-email" className="text-[#9CA89F]">
            Email
          </Label>
          <Input
            id="profile-email"
            type="email"
            defaultValue={email}
            className="bg-[#0A0E0C]/60 border-[#2D5F3F]/30 text-[#F5F5F0]"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

function AccountPageContent({
  profile,
}: {
  profile: { displayName: string; email: string; initials: string };
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0A0E0C]">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <Link to="/app/dashboard">
          <Button
            variant="ghost"
            className="mb-6 -ml-2 text-[#9CA89F] hover:text-[#F5F5F0] hover:bg-[#1B3022]/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F0] mb-6">
          Account
        </h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6 bg-[#1B3022]/60 border border-[#2D5F3F]/30 p-1">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-[#2D5F3F] data-[state=active]:text-[#F5F5F0] text-[#9CA89F]"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-[#2D5F3F] data-[state=active]:text-[#F5F5F0] text-[#9CA89F]"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-semibold text-[#4A7C5D]">Profile</h2>
              <ProfileFields
                displayName={profile.displayName}
                email={profile.email}
                initials={profile.initials}
              />
              <p className="text-sm text-[#9CA89F]">
                Profile details are managed by your account provider. To update name or email, use your provider&apos;s account settings.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-semibold text-[#4A7C5D]">Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-[#2D5F3F]/20">
                  <div>
                    <p className="text-[#F5F5F0] font-medium">Email notifications</p>
                    <p className="text-sm text-[#9CA89F]">
                      Receive updates about new features and predictions
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#2D5F3F] bg-[#0A0E0C] text-[#4A7C5D] focus:ring-[#4A7C5D]"
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[#F5F5F0] font-medium">Units</p>
                    <p className="text-sm text-[#9CA89F]">
                      Temperature and distance units
                    </p>
                  </div>
                  <select
                    className="rounded-lg border border-[#2D5F3F]/30 bg-[#0A0E0C] px-3 py-2 text-sm text-[#F5F5F0] focus:outline-none focus:ring-2 focus:ring-[#4A7C5D]"
                    defaultValue="metric"
                  >
                    <option value="metric">Metric (°C, km)</option>
                    <option value="imperial">Imperial (°F, mi)</option>
                  </select>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const hasClerkKey = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AccountPageWithClerk() {
  const { user } = useUser();
  const displayName =
    user?.firstName || user?.lastName
      ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "User"
      : "User";
  const email =
    user?.emailAddresses?.[0]?.emailAddress ?? "user@example.com";
  const initials =
    user?.firstName?.[0] && user?.lastName?.[0]
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.firstName?.[0] ??
        user?.emailAddresses?.[0]?.emailAddress?.[0] ??
        "?";
  return (
    <AccountPageContent
      profile={{ displayName, email, initials: initials.toUpperCase().slice(0, 2) }}
    />
  );
}

const defaultProfile = {
  displayName: "User",
  email: "user@example.com",
  initials: "?",
};

export function AccountPage() {
  if (hasClerkKey) {
    return <AccountPageWithClerk />;
  }
  return <AccountPageContent profile={defaultProfile} />;
}

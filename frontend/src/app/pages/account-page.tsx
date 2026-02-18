import React from "react";
import { Link } from "react-router";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import {
  useSubscription,
  SubscriptionDetailsButton,
} from "@clerk/clerk-react/experimental";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

function SubscriptionTabContent() {
  const { data: subscription, isLoading, error, revalidate } = useSubscription({
    for: "user",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#9CA89F]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        Loading subscription…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#4A7C5D]">Subscription</h2>
        <p className="text-red-400">Failed to load subscription: {error.message}</p>
        <Button
          variant="outline"
          className="border-[#2D5F3F] text-[#F5F5F0] hover:bg-[#1B3022]"
          onClick={() => revalidate()}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-semibold text-[#4A7C5D]">Subscription</h2>
        <p className="text-[#9CA89F]">You don’t have an active subscription.</p>
        <Link to="/pricing">
          <Button className="bg-[#4A7C5D] text-white hover:bg-[#3d6a4d]">
            View plans
          </Button>
        </Link>
      </div>
    );
  }

  const planNames = subscription.subscriptionItems
    ?.map((item) => item.plan?.name)
    .filter(Boolean) as string[] | undefined;
  const planName = planNames?.length ? planNames.join(", ") : "—";
  const firstItem = subscription.subscriptionItems?.[0];
  const periodLabel = firstItem?.planPeriod === "annual" ? "Yearly" : "Monthly";
  const periodStart = firstItem?.periodStart;
  const periodEnd = firstItem?.periodEnd;

  return (
    <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6 sm:p-8 space-y-6">
      <h2 className="text-lg font-semibold text-[#4A7C5D]">Subscription</h2>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#9CA89F]">Current plan</p>
            <p className="text-lg font-medium text-[#F5F5F0]">{planName}</p>
            <p className="text-sm text-[#9CA89F]">{periodLabel}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              subscription.status === "active"
                ? "bg-[#2D5F3F]/40 text-[#4A7C5D]"
                : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {subscription.status === "active" ? "Active" : "Past due"}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 border-t border-[#2D5F3F]/20 pt-4">
          {subscription.activeAt && (
            <div>
              <p className="text-sm text-[#9CA89F]">Active since</p>
              <p className="text-[#F5F5F0]">
                {new Date(subscription.activeAt).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </p>
            </div>
          )}
          {periodStart && (
            <div>
              <p className="text-sm text-[#9CA89F]">Current period start</p>
              <p className="text-[#F5F5F0]">
                {new Date(periodStart).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </p>
            </div>
          )}
          {periodEnd && (
            <div>
              <p className="text-sm text-[#9CA89F]">Current period end</p>
              <p className="text-[#F5F5F0]">
                {new Date(periodEnd).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </p>
            </div>
          )}
          {subscription.nextPayment && (
            <div>
              <p className="text-sm text-[#9CA89F]">Next payment</p>
              <p className="text-[#F5F5F0]">
                {subscription.nextPayment.amount?.amountFormatted ?? "—"} on{" "}
                {new Date(subscription.nextPayment.date).toLocaleDateString(
                  undefined,
                  { dateStyle: "medium" }
                )}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <SubscriptionDetailsButton
            subscriptionDetailsProps={{
              appearance: {
                variables: {
                  colorPrimary: "#4A7C5D",
                  colorPrimaryForeground: "#FFFFFF",
                  colorBackground: "#1B3022",
                  colorForeground: "#FFFFFF",
                  colorMutedForeground: "#E5E7E5",
                  colorMuted: "#243D2E",
                  colorInput: "#243D2E",
                  colorInputForeground: "#FFFFFF",
                  colorBorder: "#2D5F3F",
                  colorNeutral: "#2D5F3F",
                  borderRadius: "0.75rem",
                },
                elements: {
                  card: "bg-[#1B3022] text-white",
                  headerTitle: "text-white",
                  headerSubtitle: "text-[#E5E7E5]",
                  formFieldLabel: "text-[#E5E7E5]",
                  formFieldInput: "bg-[#243D2E] text-white border-[#2D5F3F]",
                  formButtonPrimary: "bg-[#4A7C5D] text-white hover:opacity-90",
                  formButtonReset: "text-white hover:text-white hover:opacity-90",
                  "clerk-accordionTrigger": "text-white",
                  "clerk-badge": "text-white",
                  a: "text-white underline hover:text-white",
                  button: "text-white",
                  "cardBox": "text-white",
                  "scrollBox": "text-white",
                },
              },
            }}
            onSubscriptionCancel={() => revalidate()}
          >
            <Button
              variant="outline"
              className="border-[#2D5F3F] text-[#F5F5F0] hover:bg-[#1B3022] inline-flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Manage subscription
            </Button>
          </SubscriptionDetailsButton>
          <Link to="/pricing">
            <Button
              variant="ghost"
              className="text-[#9CA89F] hover:text-[#F5F5F0] hover:bg-[#1B3022]/50"
            >
              Change plan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

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
  subscriptionTabContent,
}: {
  profile: { displayName: string; email: string; initials: string };
  subscriptionTabContent?: React.ReactNode;
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
              value="subscription"
              className="data-[state=active]:bg-[#2D5F3F] data-[state=active]:text-[#F5F5F0] text-[#9CA89F]"
            >
              Subscription
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

          <TabsContent value="subscription" className="mt-0">
            {subscriptionTabContent ?? (
              <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-[#4A7C5D] mb-2">Subscription</h2>
                <p className="text-[#9CA89F]">Subscription management is not available.</p>
              </div>
            )}
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

const hasClerkKey = !!(import.meta as unknown as { env?: { VITE_CLERK_PUBLISHABLE_KEY?: string } }).env?.VITE_CLERK_PUBLISHABLE_KEY;

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
      subscriptionTabContent={<SubscriptionTabContent />}
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

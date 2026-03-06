import React, { useState } from "react";
import { Protect, useUser } from "@clerk/clerk-react";
import {
  usePlans,
  CheckoutButton,
} from "@clerk/clerk-react/experimental";
import { Check, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface RequirePlanProps {
  children: React.ReactNode;
}

const hasClerkKey = !!(import.meta as unknown as { env?: { VITE_CLERK_PUBLISHABLE_KEY?: string } }).env?.VITE_CLERK_PUBLISHABLE_KEY;

const env = (import.meta as unknown as { env?: { VITE_APP_URL?: string } }).env;
const appUrl = env?.VITE_APP_URL?.trim();
const redirectUrl = appUrl
  ? `${appUrl}/app/dashboard`
  : typeof window !== "undefined"
    ? `${window.location.origin}/app/dashboard`
    : "/app/dashboard";

const checkoutAppearance = {
  variables: {
    colorPrimary: "#4A7C5D",
    colorBackground: "#0A0E0C",
    colorInputBackground: "#1B3022",
    colorInputText: "#F5F5F0",
    colorText: "#F5F5F0",
    colorTextSecondary: "#9CA89F",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "bg-[#1B3022]/60 border border-[#2D5F3F]/30",
    headerTitle: "text-[#F5F5F0]",
    headerSubtitle: "text-[#9CA89F]",
  },
};

/**
 * When Clerk Billing is enabled, only users with a paid plan (Basic or premium) can see the children.
 * Users without a paid plan see the plan options and can subscribe on the same page.
 * When Clerk is not configured, children are always shown.
 */
function ChoosePlanFallback() {
  const [period, setPeriod] = useState<"month" | "annual">("month");
  const { data: plans, isLoading } = usePlans({ for: "user", pageSize: 20 });

  const paidPlans = (plans ?? []).filter((p) => p.hasBaseFee);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-[#4A7C5D]" />
      </div>
    );
  }

  if (paidPlans.length === 0) {
    return (
      <div className="min-h-[60vh] py-12 px-4 flex items-center justify-center">
        <p className="text-[#9CA89F]">No paid plans available. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F0] mb-2">
          Choose a plan to continue
        </h2>
        <p className="text-[#9CA89F] mb-6">
          Select Basic or Premium below to access the app. You can cancel anytime.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === "month"
                ? "bg-[#4A7C5D] text-[#F5F5F0]"
                : "bg-[#1B3022] text-[#9CA89F] border border-[#2D5F3F]"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPeriod("annual")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === "annual"
                ? "bg-[#4A7C5D] text-[#F5F5F0]"
                : "bg-[#1B3022] text-[#9CA89F] border border-[#2D5F3F]"
            }`}
          >
            Yearly (Save 10%)
          </button>
        </div>
      </div>
      <div className="grid gap-6 max-w-4xl mx-auto md:grid-cols-2">
        {paidPlans.map((plan) => {
          const fee = period === "annual" ? plan.annualFee : plan.fee;
          const amount = fee?.amountFormatted ?? "—";
          const currencySymbol = fee?.currencySymbol ?? plan.fee?.currencySymbol ?? "";
          const periodLabel = period === "annual" ? "/year" : "/month";
          const trialText = plan.freeTrialEnabled && plan.freeTrialDays
            ? `${plan.freeTrialDays}-day trial`
            : null;
          return (
            <Card
              key={plan.id}
              className="p-6 bg-[#1B3022]/40 border-[#2D5F3F]/30 flex flex-col"
            >
              <h3 className="text-xl font-semibold text-[#F5F5F0] mb-1">{plan.name}</h3>
              {plan.description && (
                <p className="text-sm text-[#9CA89F] mb-4">{plan.description}</p>
              )}
              <div className="mb-4">
                <span className="text-3xl font-semibold text-[#F5F5F0] tabular-nums">
                  {currencySymbol} {amount}
                </span>
                <span className="text-[#9CA89F]">{periodLabel}</span>
                {trialText && (
                  <p className="text-sm text-[#4A7C5D] mt-1">{trialText}</p>
                )}
              </div>
              {plan.features?.length > 0 && (
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.slice(0, 5).map((f) => (
                    <li key={f.id} className="flex items-center gap-2 text-sm text-[#9CA89F]">
                      <Check className="h-4 w-4 shrink-0 text-[#4A7C5D]" />
                      {f.name}
                    </li>
                  ))}
                </ul>
              )}
              <CheckoutButton
                planId={plan.id}
                planPeriod={period}
                for="user"
                newSubscriptionRedirectUrl={redirectUrl}
                checkoutProps={{ appearance: checkoutAppearance }}
              >
                <Button className="w-full bg-[#4A7C5D] hover:bg-[#3d6a4d] text-[#F5F5F0]">
                  Start trial
                </Button>
              </CheckoutButton>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function RequirePlan({ children }: RequirePlanProps) {
  const { user, isLoaded } = useUser();

  if (!hasClerkKey) {
    return <>{children}</>;
  }

  if (isLoaded && user?.publicMetadata?.admin === true) {
    return <>{children}</>;
  }

  return (
    <Protect
      condition={(has) =>
        has({ plan: "basic" }) ||
        has({ plan: "Basic" }) ||
        has({ plan: "premium" }) ||
        has({ plan: "Premium" })
      }
      fallback={<ChoosePlanFallback />}
    >
      {children}
    </Protect>
  );
}

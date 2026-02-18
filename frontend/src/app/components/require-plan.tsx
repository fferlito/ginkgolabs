import React from "react";
import { Protect, PricingTable } from "@clerk/clerk-react";

interface RequirePlanProps {
  children: React.ReactNode;
}

const hasClerkKey = !!(import.meta as unknown as { env?: { VITE_CLERK_PUBLISHABLE_KEY?: string } }).env?.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * When Clerk Billing is enabled, only users with a paid plan (Basic or premium) can see the children.
 * Users without a paid plan see the plan options and can subscribe on the same page.
 * When Clerk is not configured, children are always shown.
 */
function ChoosePlanFallback() {
  return (
    <div className="min-h-[60vh] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F0] mb-2">
          Choose a plan to continue
        </h2>
        <p className="text-[#9CA89F]">
          Select Basic or Premium below to access the app. You can cancel anytime.
        </p>
      </div>
      <div className="max-w-4xl mx-auto">
        <PricingTable
          for="user"
          newSubscriptionRedirectUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/app/dashboard`}
          appearance={{
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
          }}
        />
      </div>
    </div>
  );
}

export function RequirePlan({ children }: RequirePlanProps) {
  if (!hasClerkKey) {
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

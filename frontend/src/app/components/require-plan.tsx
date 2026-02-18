import { Protect } from "@clerk/clerk-react";
import { Link } from "react-router";

interface RequirePlanProps {
  children: React.ReactNode;
}

const hasClerkKey = !!(import.meta as unknown as { env?: { VITE_CLERK_PUBLISHABLE_KEY?: string } }).env?.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * When Clerk Billing is enabled, only users with a paid plan (Basic or premium) can see the children.
 * Users without a paid plan see a fallback with a link to the pricing page.
 * When Clerk is not configured, children are always shown.
 */
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
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <h2 className="text-2xl font-semibold text-[#F5F5F0] mb-2">Subscription required</h2>
          <p className="text-[#9CA89F] mb-6 max-w-md">
            Upgrade to Basic or Premium to access the app.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-lg bg-[#4A7C5D] px-6 py-3 text-sm font-medium text-white hover:bg-[#3d6a4d] transition-colors"
          >
            View plans
          </Link>
        </div>
      }
    >
      {children}
    </Protect>
  );
}

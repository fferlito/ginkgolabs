import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigate } from "react-router";

interface RequireAuthProps {
  children: React.ReactNode;
}

const hasClerkKey = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function RequireAuth({ children }: RequireAuthProps) {
  // Without Clerk key (e.g. local dev), allow access so dashboard can be tested
  if (!hasClerkKey) {
    return <>{children}</>;
  }
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/app" replace />
      </SignedOut>
    </>
  );
}

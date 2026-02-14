import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigate } from "react-router";

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/app" replace />
      </SignedOut>
    </>
  );
}

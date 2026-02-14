import { ClerkProvider } from "@clerk/clerk-react";
import { RouterProvider } from "react-router";
import { router } from "./routes";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";

export default function App() {
  const content = <RouterProvider router={router} />;
  if (!publishableKey) {
    return content;
  }
  return <ClerkProvider publishableKey={publishableKey}>{content}</ClerkProvider>;
}

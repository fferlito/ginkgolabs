import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/root-layout";
import { AppLayout } from "./components/app-layout";
import { RequireAuth } from "./components/require-auth";
import { LandingPage } from "./pages/landing";
import { SciencePage } from "./pages/science";
import { PricingPage } from "./pages/pricing";
import { ContactPage } from "./pages/contact";
import { AppLoginPage } from "./pages/app-login";
import { DashboardPage } from "./pages/dashboard-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: "science", Component: SciencePage },
      { path: "pricing", Component: PricingPage },
      { path: "contact", Component: ContactPage },
    ],
  },
  { path: "/app", Component: AppLoginPage },
  {
    path: "/app/dashboard",
    Component: AppLayout,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);
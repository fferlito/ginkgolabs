import React from "react";
import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/root-layout";
import { AppLayout } from "./components/app-layout";
import { RequireAuth } from "./components/require-auth";
import { RequirePlan } from "./components/require-plan";
import { LandingPage } from "./pages/landing";
import { SciencePage } from "./pages/science";
import { PricingPage } from "./pages/pricing";
import { ContactPage } from "./pages/contact";
import { AppLoginPage } from "./pages/app-login";
import { DashboardPage } from "./pages/dashboard-page";
import { PrivacyTermsPage } from "./pages/privacy-terms-page";
import { AccountPage } from "./pages/account-page";
import { MushroompediaPage } from "./pages/mushroompedia-page";

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
            <RequirePlan>
              <DashboardPage />
            </RequirePlan>
          </RequireAuth>
        ),
      },
    ],
  },
  {
    path: "/app/privacy",
    Component: AppLayout,
    children: [{ index: true, Component: PrivacyTermsPage }],
  },
  {
    path: "/app/account",
    Component: AppLayout,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <RequirePlan>
              <AccountPage />
            </RequirePlan>
          </RequireAuth>
        ),
      },
    ],
  },
  {
    path: "/app/mushroompedia",
    Component: AppLayout,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <RequirePlan>
              <MushroompediaPage />
            </RequirePlan>
          </RequireAuth>
        ),
      },
    ],
  },
]);
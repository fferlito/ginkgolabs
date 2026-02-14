import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/root-layout";
import { LandingPage } from "./pages/landing";
import { SciencePage } from "./pages/science";
import { PricingPage } from "./pages/pricing";
import { ContactPage } from "./pages/contact";

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
]);
import { SignIn } from "@clerk/clerk-react";

const hasClerkKey = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: "#2D5F3F",
    colorBackground: "#0A0E0C",
    colorText: "#F5F5F0",
    colorTextSecondary: "#9CA89F",
    borderRadius: "0.75rem",
  },
  elements: {
    formButtonPrimary: "bg-[#2D5F3F] hover:bg-[#4A7C5D]",
    card: "bg-[#0A0E0C] border border-[#2D5F3F]/30 shadow-xl",
    headerTitle: "text-[#F5F5F0]",
    headerSubtitle: "text-[#9CA89F]",
    socialButtonsBlockButton: "border-[#2D5F3F] text-[#F5F5F0]",
    formFieldLabel: "text-[#9CA89F]",
    formFieldInput: "bg-[#1B3022] border-[#2D5F3F] text-[#F5F5F0]",
    footerActionLink: "text-[#4A7C5D] hover:text-[#6B9B7A]",
  },
};

const APP_LOGIN_IMAGE =
  "https://images.unsplash.com/photo-1760509867646-fea60ad26b91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

export function AppLoginPage() {
  return (
    <div className="min-h-screen flex bg-[#0A0E0C]">
      {/* Left: Clerk sign-in form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {hasClerkKey ? (
            <SignIn
              appearance={CLERK_APPEARANCE}
              fallbackRedirectUrl="/"
              signUpUrl="/app"
            />
          ) : (
            <div className="rounded-xl border border-[#2D5F3F]/30 bg-[#0A0E0C] p-8 text-center">
              <p className="text-[#9CA89F] mb-4">
                Add <code className="text-[#4A7C5D]">VITE_CLERK_PUBLISHABLE_KEY</code> to your .env to enable sign-in.
              </p>
              <p className="text-sm text-[#6B7B6E]">
                Get your key at{" "}
                <a
                  href="https://clerk.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#4A7C5D] hover:underline"
                >
                  clerk.com
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Right: Image */}
      <div className="hidden lg:block lg:w-[50%] xl:w-[55%] relative overflow-hidden">
        <img
          src={APP_LOGIN_IMAGE}
          alt="Forest foraging"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E0C] via-[#0A0E0C]/40 to-transparent" />
      </div>
    </div>
  );
}

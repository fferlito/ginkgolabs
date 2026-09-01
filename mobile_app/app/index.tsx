import { Redirect } from "expo-router";

const hasClerk = !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function Index() {
  return <Redirect href={hasClerk ? "/login" : "/map"} />;
}

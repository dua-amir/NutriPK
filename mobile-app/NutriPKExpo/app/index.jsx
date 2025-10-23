import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function IndexRedirect() {
  const router = useRouter();
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (typeof router.replace === "function") {
        router.replace("/SplashScreen");
      }
    }, 50); // 50ms delay to let the layout mount
    return () => clearTimeout(timeout);
  }, [router]);
  return null;
}

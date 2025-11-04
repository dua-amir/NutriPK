import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        initialRouteName="screens/SplashScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="screens/SplashScreen" />
        <Stack.Screen name="Onboarding1" />
        <Stack.Screen name="Onboarding2" />
        <Stack.Screen name="screens/AccountCreate" />
        <Stack.Screen name="Login" />
        <Stack.Screen name="SignUp" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="Profile" />
        <Stack.Screen name="Home" />
        <Stack.Screen name="tabs" />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

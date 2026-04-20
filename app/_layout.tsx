import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AuthProvider from "@/provider/AuthProvider";
import { useAuth } from "@/ctx/AuthContext";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import IntroScreen from "@/components/auth/IntroScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import { useDeepLinking } from "../hooks/useDeepLinking";
import {  useEffect } from "react";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { loading, session, profile } = useAuth();
  const segments = useSegments();

  // Handle deep linking for magic links
  useDeepLinking();

  useEffect(() => {
    if (!loading && session) {
      if (!profile || !profile?.onboarding_completed) {
        const inBoarding = segments[0] === "onboarding";

        if (!inBoarding) {
          router.replace("/onboarding");
        }
      }
    }
  }, [loading, session, profile, segments]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!session) {
    return (
      <ThemeProvider value={DefaultTheme}>
        <GestureHandlerRootView style={styles.container}>
          <IntroScreen />
          <Toaster />
        </GestureHandlerRootView>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={styles.container}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
        </Stack>
        <Toaster />
      </GestureHandlerRootView>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
});

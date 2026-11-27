import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as Linking from "expo-linking";
import { useAuthStore } from "@/store/authStore";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      if (url.includes("wallet/fund/success")) {
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        Toast.show({ type: "success", text1: "Wallet funded successfully! 🎉" });
        router.replace("/(tabs)");
      } else if (url.includes("wallet/fund/failed")) {
        Toast.show({ type: "error", text1: "Payment was not completed." });
        router.replace("/(tabs)");
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="wallet" />
            <Stack.Screen name="eload" />
            <Stack.Screen name="cashout" />
            <Stack.Screen name="transfer" />
            <Stack.Screen name="transactions" />
            <Stack.Screen name="profile" />
          </Stack>
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

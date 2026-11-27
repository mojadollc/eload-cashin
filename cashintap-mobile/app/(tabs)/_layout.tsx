import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { COLORS, RADIUS, SHADOW } from "@/utils/theme";
import { notificationApi } from "@/api/endpoints";

function TabIcon({ name, focused }: { name: any; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={focused ? COLORS.primary : COLORS.textMuted} />
    </View>
  );
}

function NotifIcon({ focused }: { focused: boolean }) {
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getAll({ limit: 1 }).then((r) => r.data.data),
    staleTime: 60_000,
  });
  const unread = data?.unreadCount || 0;

  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={focused ? "notifications" : "notifications-outline"}
        size={22}
        color={focused ? COLORS.primary : COLORS.textMuted}
      />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "receipt" : "receipt-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => <NotifIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "person" : "person-outline"} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 16,
    left: 24,
    right: 24,
    height: 64,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.surfaceElevated,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconWrapActive: {
    backgroundColor: COLORS.primaryLight,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: "800", color: COLORS.white },
});

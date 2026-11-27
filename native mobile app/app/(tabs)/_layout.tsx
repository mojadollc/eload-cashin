import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Platform } from "react-native";
import { COLORS, RADIUS, SHADOW } from "@/utils/theme";

function TabIcon({ name, focused }: { name: any; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={focused ? COLORS.primary : COLORS.textMuted} />
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
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "notifications" : "notifications-outline"} focused={focused} />,
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
  },
  iconWrapActive: {
    backgroundColor: COLORS.primaryLight,
  },
});

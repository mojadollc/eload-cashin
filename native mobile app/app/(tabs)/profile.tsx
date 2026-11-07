import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { profileApi, authApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import { COLORS, SPACING, RADIUS, SHADOW } from "@/utils/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();
  const [biometricEnabled, setBiometricEnabled] = useState(user?.biometricsEnabled || false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.get().then((r) => r.data.data),
  });

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try { await authApi.logout(); } catch {}
          await clearAuth();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const toggleBiometric = async (val: boolean) => {
    if (val) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Toast.show({ type: "error", text1: "Biometrics not supported on this device" });
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Toast.show({ type: "error", text1: "No biometrics enrolled. Set up in device settings." });
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Authenticate to enable biometrics" });
      if (result.success) {
        await SecureStore.setItemAsync("biometric_user_id", user?.id || "");
        setBiometricEnabled(true);
        Toast.show({ type: "success", text1: "Biometrics enabled!" });
      }
    } else {
      await SecureStore.deleteItemAsync("biometric_user_id");
      await SecureStore.deleteItemAsync("biometric_pin");
      setBiometricEnabled(false);
    }
  };

  const displayUser = profile || user;
  const initials = `${displayUser?.firstName?.[0] || ""}${displayUser?.lastName?.[0] || ""}`.toUpperCase();

  const menuItems = [
    { icon: "person-outline", label: "Edit Profile", onPress: () => router.push("/profile/edit") },
    { icon: "keypad-outline", label: "Set / Change MPIN", onPress: () => router.push("/(auth)/set-mpin") },
    { icon: "lock-closed-outline", label: "Forgot MPIN", onPress: () => router.push("/(auth)/forgot-mpin") },
    { icon: "card-outline", label: "Cashout Destinations", onPress: () => router.push("/cashout/destinations") },
    { icon: "shield-checkmark-outline", label: "KYC Verification", onPress: () => router.push("/profile/kyc") },
    { icon: "help-circle-outline", label: "Support", onPress: () => router.push("/profile/support") },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: SPACING.xxl }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{displayUser?.firstName} {displayUser?.lastName}</Text>
        <Text style={styles.mobile}>{displayUser?.mobile}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, styles.roleBadge]}>
            <Text style={styles.badgeText}>{displayUser?.role}</Text>
          </View>
          <View style={[styles.badge, styles.kycBadge]}>
            <Text style={styles.badgeText}>KYC: {(displayUser as any)?.kycStatus || "NONE"}</Text>
          </View>
        </View>
      </View>

      {/* Biometric Toggle */}
      <View style={styles.section}>
        <View style={styles.biometricRow}>
          <View style={styles.biometricLeft}>
            <Ionicons name="finger-print" size={22} color={COLORS.primary} />
            <Text style={styles.biometricLabel}>Biometric Login</Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      {/* Menu */}
      <View style={styles.section}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity key={idx} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <View style={[styles.section, { marginTop: 0 }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>CashIn Tap v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: COLORS.white },
  name: { fontSize: 20, fontWeight: "800", color: COLORS.white },
  mobile: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  badges: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
  badge: { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4 },
  roleBadge: { backgroundColor: "rgba(255,255,255,0.2)" },
  kycBadge: { backgroundColor: "rgba(255,255,255,0.15)" },
  badgeText: { fontSize: 11, fontWeight: "700", color: COLORS.white },
  section: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    ...SHADOW.sm,
  },
  biometricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
  },
  biometricLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  biometricLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, color: COLORS.text, fontWeight: "500" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: COLORS.danger },
  version: { textAlign: "center", fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.lg },
});

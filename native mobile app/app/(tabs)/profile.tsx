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

const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      { icon: "person-outline", label: "Edit Profile", route: "/profile/edit", color: COLORS.primary },
      { icon: "keypad-outline", label: "Set / Change MPIN", route: "/(auth)/set-mpin", color: COLORS.accent },
      { icon: "lock-closed-outline", label: "Forgot MPIN", route: "/(auth)/forgot-mpin", color: COLORS.warning },
    ],
  },
  {
    title: "Finance",
    items: [
      { icon: "card-outline", label: "Cashout Destinations", route: "/cashout/destinations", color: COLORS.info },
      { icon: "shield-checkmark-outline", label: "KYC Verification", route: "/profile/kyc", color: COLORS.success },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "help-circle-outline", label: "Help & Support", route: "/profile/support", color: COLORS.textSecondary },
    ],
  },
];

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
      if (!compatible) { Toast.show({ type: "error", text1: "Biometrics not supported" }); return; }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) { Toast.show({ type: "error", text1: "No biometrics enrolled" }); return; }
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.avatarBadge}>
            <Ionicons name="checkmark" size={10} color={COLORS.white} />
          </View>
        </View>
        <Text style={styles.name}>{displayUser?.firstName} {displayUser?.lastName}</Text>
        <Text style={styles.mobile}>{displayUser?.mobile}</Text>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{displayUser?.role}</Text>
          </View>
          <View style={[styles.badge, styles.kycBadge]}>
            <Text style={styles.badgeText}>KYC: {(displayUser as any)?.kycStatus || "NONE"}</Text>
          </View>
        </View>
      </View>

      {/* Biometric Toggle */}
      <View style={styles.biometricCard}>
        <View style={styles.biometricLeft}>
          <View style={[styles.menuIconWrap, { backgroundColor: "rgba(108,99,255,0.15)" }]}>
            <Ionicons name="finger-print" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.biometricLabel}>Biometric Login</Text>
            <Text style={styles.biometricSub}>Use Face ID or fingerprint</Text>
          </View>
        </View>
        <Switch
          value={biometricEnabled}
          onValueChange={toggleBiometric}
          trackColor={{ false: COLORS.surfaceHighlight, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      </View>

      {/* Menu Sections */}
      {MENU_SECTIONS.map((section) => (
        <View key={section.title} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{section.title}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.menuItem, idx > 0 && styles.menuItemBorder]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconWrap, { backgroundColor: item.color + "20" }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      <View style={styles.menuSection}>
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
    alignItems: "center",
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  avatarWrap: { position: "relative", marginBottom: SPACING.md },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  avatarText: { fontSize: 30, fontWeight: "800", color: COLORS.white },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  name: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  mobile: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  badges: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.primaryLight,
  },
  kycBadge: { backgroundColor: COLORS.accentLight },
  badgeText: { fontSize: 11, fontWeight: "700", color: COLORS.text },
  biometricCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  biometricLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  biometricLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  biometricSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  menuSection: { paddingHorizontal: SPACING.lg, marginTop: SPACING.md },
  menuSectionTitle: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, marginBottom: SPACING.sm, textTransform: "uppercase", letterSpacing: 1 },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
  },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
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
    backgroundColor: "rgba(255,92,122,0.1)",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(255,92,122,0.2)",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: COLORS.danger },
  version: { textAlign: "center", fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.lg },
});

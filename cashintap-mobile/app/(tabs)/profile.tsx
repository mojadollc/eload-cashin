import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch,
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
import { COLORS, SPACING, RADIUS, FONT_SIZE, SHADOW } from "@/utils/theme";

const MENU: { title: string; items: { icon: keyof typeof Ionicons.glyphMap; label: string; route: string; color: string; badge?: string }[] }[] = [
  {
    title: "Account",
    items: [
      { icon: "person-outline", label: "Edit Profile", route: "/profile/edit", color: COLORS.primary },
      { icon: "keypad-outline", label: "Set / Change MPIN", route: "/(auth)/set-mpin", color: COLORS.accent },
      { icon: "lock-closed-outline", label: "Change Password", route: "/profile/change-password", color: COLORS.warning },
    ],
  },
  {
    title: "Finance",
    items: [
      { icon: "card-outline", label: "Saved Accounts", route: "/cashout/destinations", color: COLORS.info },
      { icon: "shield-checkmark-outline", label: "KYC Verification", route: "/profile/kyc", color: COLORS.success, badge: "Verify" },
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

  const displayUser = profile || user;
  const initials = `${displayUser?.firstName?.[0] || ""}${displayUser?.lastName?.[0] || ""}`.toUpperCase();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
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
      if (!compatible) { Toast.show({ type: "error", text1: "Biometrics not supported on this device" }); return; }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) { Toast.show({ type: "error", text1: "No biometrics enrolled in device settings" }); return; }
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={9} color={COLORS.white} />
          </View>
        </View>
        <Text style={styles.name}>{displayUser?.firstName} {displayUser?.lastName}</Text>
        <Text style={styles.mobile}>{displayUser?.mobile}</Text>
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{displayUser?.role || "USER"}</Text>
          </View>
          <View style={[styles.tag, styles.tagAccent]}>
            <Ionicons name="shield-outline" size={10} color={COLORS.accent} />
            <Text style={[styles.tagText, { color: COLORS.accent }]}>
              KYC: {(displayUser as any)?.kycStatus || "NONE"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Biometric Toggle */}
        <View style={styles.biometricCard}>
          <View style={styles.biometricLeft}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="finger-print" size={19} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.biometricLabel}>Biometric Login</Text>
              <Text style={styles.biometricSub}>Face ID or fingerprint</Text>
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
        {MENU.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.menuItem, idx > 0 && styles.menuItemBorder]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.65}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: item.color + "18" }]}>
                      <Ionicons name={item.icon} size={17} color={item.color} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuRight}>
                    {item.badge && (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={15} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>CashIn Tap v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: "center", paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
  avatarWrap: { position: "relative", marginBottom: SPACING.md },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: COLORS.primaryMid,
    ...SHADOW.glow,
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: COLORS.white },
  verifiedBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: COLORS.background,
  },
  name: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.text, letterSpacing: -0.3 },
  mobile: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  tagsRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: COLORS.primaryLight,
  },
  tagAccent: { backgroundColor: COLORS.accentLight },
  tagText: { fontSize: FONT_SIZE.xs, fontWeight: "700", color: COLORS.primary },
  body: { paddingHorizontal: SPACING.lg },
  biometricCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  biometricLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  biometricLabel: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.text },
  biometricSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  section: { marginBottom: SPACING.md },
  sectionTitle: {
    fontSize: FONT_SIZE.xs, fontWeight: "700", color: COLORS.textMuted,
    marginBottom: SPACING.sm, textTransform: "uppercase", letterSpacing: 1.2,
  },
  menuCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: SPACING.md,
  },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  menuIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: FONT_SIZE.md, color: COLORS.text, fontWeight: "500" },
  menuRight: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  menuBadge: {
    backgroundColor: COLORS.warningLight, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  menuBadgeText: { fontSize: 10, fontWeight: "700", color: COLORS.warning },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: SPACING.sm, padding: SPACING.md,
    backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.danger + "30",
    marginBottom: SPACING.lg,
  },
  logoutText: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.danger },
  version: { textAlign: "center", fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: SPACING.md },
});

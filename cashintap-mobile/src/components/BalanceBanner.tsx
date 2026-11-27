import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS } from "@/utils/theme";
import { formatCurrency } from "@/utils/helpers";
import { useWallet } from "@/hooks/useWallet";

interface BalanceBannerProps {
  variant?: "accent" | "primary";
}

export default function BalanceBanner({ variant = "accent" }: BalanceBannerProps) {
  const { data: wallet } = useWallet();
  const isAccent = variant === "accent";

  return (
    <View style={[styles.banner, isAccent ? styles.accentBanner : styles.primaryBanner]}>
      <Ionicons
        name="wallet-outline"
        size={16}
        color={isAccent ? COLORS.accent : COLORS.white}
      />
      <Text style={[styles.label, { color: isAccent ? COLORS.textSecondary : "rgba(255,255,255,0.8)" }]}>
        Balance:
      </Text>
      <Text style={[styles.amount, { color: isAccent ? COLORS.accent : COLORS.white }]}>
        {formatCurrency(wallet?.availableBalance || "0")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
  },
  accentBanner: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent + "30",
  },
  primaryBanner: {
    backgroundColor: COLORS.primary,
    borderColor: "rgba(255,255,255,0.15)",
  },
  label: { fontSize: 14 },
  amount: { fontSize: 16, fontWeight: "800" },
});

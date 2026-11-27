import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { qrApi } from "@/api/endpoints";
import Header from "@/components/Header";
import { COLORS, SPACING, RADIUS, SHADOW } from "@/utils/theme";
import { useAuthStore } from "@/store/authStore";

export default function QRScreen() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ["qr-code"],
    queryFn: () => qrApi.generate().then((r) => r.data.data),
  });

  const copyAccount = async () => {
    const val = data?.accountNumber || "";
    await Clipboard.setStringAsync(val);
    Toast.show({ type: "success", text1: "Account number copied!" });
  };

  const shareQR = async () => {
    await Share.share({
      message: `Pay me via CashIn Tap!\nName: ${user?.firstName} ${user?.lastName}\nAccount: ${data?.accountNumber}`,
    });
  };

  return (
    <View style={styles.container}>
      <Header title="My QR Code" />
      <View style={styles.content}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>₱</Text>
            </View>
            <Text style={styles.appName}>CashIn Tap</Text>
          </View>

          {/* QR Area */}
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.xl }} />
          ) : (
            <View style={styles.qrBox}>
              {/* QR Grid Pattern */}
              <View style={styles.qrGrid}>
                {Array.from({ length: 9 }).map((_, row) =>
                  Array.from({ length: 9 }).map((_, col) => {
                    const isCorner =
                      (row < 3 && col < 3) ||
                      (row < 3 && col > 5) ||
                      (row > 5 && col < 3);
                    const isInnerCorner =
                      (row >= 1 && row <= 1 && col >= 1 && col <= 1) ||
                      (row >= 1 && row <= 1 && col >= 7 && col <= 7) ||
                      (row >= 7 && row <= 7 && col >= 1 && col <= 1);
                    const isFilled =
                      isCorner ||
                      (row === 4 && col % 2 === 0) ||
                      (col === 4 && row % 2 === 0) ||
                      Math.random() > 0.6;
                    return (
                      <View
                        key={`${row}-${col}`}
                        style={[
                          styles.qrCell,
                          isFilled && styles.qrCellFilled,
                          isCorner && styles.qrCellCorner,
                        ]}
                      />
                    );
                  })
                )}
              </View>
              <View style={styles.qrCenter}>
                <Text style={styles.qrCenterText}>₱</Text>
              </View>
            </View>
          )}

          {/* Name */}
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>

          {/* Account Number */}
          <TouchableOpacity style={styles.accountRow} onPress={copyAccount}>
            <Text style={styles.accountLabel}>Account No.</Text>
            <Text style={styles.account}>{data?.accountNumber || "—"}</Text>
            <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={copyAccount}>
            <View style={styles.actionIcon}>
              <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={shareQR}>
            <View style={styles.actionIcon}>
              <Ionicons name="share-outline" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Show this QR code to receive payments from other CashIn Tap users.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SPACING.lg, alignItems: "center" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.lg },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 16, color: COLORS.white, fontWeight: "800" },
  appName: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  qrBox: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  qrGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 176,
    height: 176,
  },
  qrCell: {
    width: 176 / 9 - 1,
    height: 176 / 9 - 1,
    margin: 0.5,
    borderRadius: 1,
    backgroundColor: "transparent",
  },
  qrCellFilled: { backgroundColor: "#1a1a2e" },
  qrCellCorner: { backgroundColor: COLORS.primary },
  qrCenter: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  qrCenterText: { fontSize: 18, color: COLORS.white, fontWeight: "800" },
  name: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.sm },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  accountLabel: { fontSize: 12, color: COLORS.textSecondary },
  account: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  actions: { flexDirection: "row", gap: SPACING.lg, marginTop: SPACING.xl },
  actionBtn: { alignItems: "center", gap: SPACING.xs },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  hint: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: SPACING.lg,
    lineHeight: 20,
  },
});

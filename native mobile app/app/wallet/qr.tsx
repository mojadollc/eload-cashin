import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
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

  const copyQR = async () => {
    if (data?.qrData) {
      await Clipboard.setStringAsync(data.qrData);
      Toast.show({ type: "success", text1: "QR data copied!" });
    }
  };

  return (
    <View style={styles.container}>
      <Header title="My QR Code" />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.accountLabel}>Account Number</Text>
          <Text style={styles.account}>{data?.accountNumber || "—"}</Text>

          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.xl }} />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrIcon}>⬛</Text>
              <Text style={styles.qrNote}>QR Code</Text>
              <Text style={styles.qrData} numberOfLines={2}>{data?.qrData}</Text>
            </View>
          )}

          <TouchableOpacity onPress={copyQR} style={styles.copyBtn}>
            <Text style={styles.copyText}>📋 Copy QR Data</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Share this QR code to receive payments from other CashIn Tap users.
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
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    width: "100%",
    ...SHADOW.md,
  },
  name: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  accountLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.xs },
  account: { fontSize: 16, fontWeight: "700", color: COLORS.primary, marginBottom: SPACING.lg },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  qrIcon: { fontSize: 64 },
  qrNote: { fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.xs },
  qrData: { fontSize: 10, color: COLORS.textMuted, textAlign: "center", marginTop: 4, paddingHorizontal: SPACING.sm },
  copyBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  copyText: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  hint: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginTop: SPACING.lg, lineHeight: 20 },
});

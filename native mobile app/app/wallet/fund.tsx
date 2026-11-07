import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { walletApi } from "@/api/endpoints";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS, SHADOW } from "@/utils/theme";
import { formatCurrency } from "@/utils/helpers";

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function FundWalletScreen() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const numAmount = parseFloat(amount) || 0;

  const handleFund = async () => {
    if (numAmount < 100) {
      Toast.show({ type: "error", text1: "Minimum funding amount is ₱100" });
      return;
    }
    if (numAmount > 50000) {
      Toast.show({ type: "error", text1: "Maximum funding amount is ₱50,000" });
      return;
    }
    setLoading(true);
    try {
      const res = await walletApi.fund(
        numAmount,
        "cashintap://wallet/fund/success",
        "cashintap://wallet/fund/failed"
      );
      const { checkoutUrl } = res.data.data;
      if (checkoutUrl) {
        await Linking.openURL(checkoutUrl);
        router.back();
      }
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.error || "Failed to create payment" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Fund Wallet" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.card}>
          <Text style={styles.label}>Enter Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.peso}>₱</Text>
            <Input
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              containerStyle={{ flex: 1, marginBottom: 0 }}
              style={{ fontSize: 28, fontWeight: "700" } as any}
            />
          </View>
          <Text style={styles.hint}>Min: ₱100 · Max: ₱50,000</Text>
        </View>

        {/* Preset amounts */}
        <Text style={styles.sectionLabel}>Quick Select</Text>
        <View style={styles.presetGrid}>
          {PRESET_AMOUNTS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.presetBtn, numAmount === a && styles.presetBtnActive]}
              onPress={() => setAmount(String(a))}
            >
              <Text style={[styles.presetText, numAmount === a && styles.presetTextActive]}>
                {formatCurrency(a)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        {numAmount >= 100 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount to Load</Text>
              <Text style={styles.summaryValue}>{formatCurrency(numAmount)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontWeight: "700" }]}>You Pay</Text>
              <Text style={[styles.summaryValue, { color: COLORS.primary, fontWeight: "800" }]}>
                {formatCurrency(numAmount)}
              </Text>
            </View>
            <Text style={styles.paymentNote}>
              You'll be redirected to PayMongo to complete payment via GCash, Maya, or card.
            </Text>
          </View>
        )}

        <Button
          title="Proceed to Payment"
          onPress={handleFund}
          loading={loading}
          disabled={numAmount < 100}
          size="lg"
          style={styles.btn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOW.sm, marginBottom: SPACING.lg },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: SPACING.sm },
  amountRow: { flexDirection: "row", alignItems: "center" },
  peso: { fontSize: 28, fontWeight: "700", color: COLORS.text, marginRight: SPACING.xs },
  hint: { fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.xs },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.sm },
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg },
  presetBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  presetBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  presetText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  presetTextActive: { color: COLORS.primary },
  summaryCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOW.sm, marginBottom: SPACING.lg },
  summaryTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm },
  summaryLabel: { fontSize: 14, color: COLORS.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  paymentNote: { fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.sm, lineHeight: 18 },
  btn: { marginTop: SPACING.sm },
});

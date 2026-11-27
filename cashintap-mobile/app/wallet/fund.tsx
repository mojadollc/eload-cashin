import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Linking, TextInput,
} from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { walletApi } from "@/api/endpoints";
import Header from "@/components/Header";
import Button from "@/components/Button";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";
import { formatCurrency } from "@/utils/helpers";

const PRESETS = [100, 200, 500, 1000, 2000, 5000];

export default function FundWalletScreen() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount >= 100 && numAmount <= 50000;

  const handleFund = async () => {
    if (!isValid) {
      Toast.show({ type: "error", text1: numAmount < 100 ? "Minimum is ₱100" : "Maximum is ₱50,000" });
      return;
    }
    setLoading(true);
    try {
      const res = await walletApi.fund(numAmount, "cashintap://wallet/fund/success", "cashintap://wallet/fund/failed");
      const { checkoutUrl } = res.data.data;
      if (checkoutUrl) {
        await Linking.openURL(checkoutUrl);
        router.back();
      }
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.error || "Failed to create payment" });
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Fund Wallet" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Amount Input */}
        <View style={styles.amountCard}>
          <Text style={styles.amountCardLabel}>Enter Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.pesoSign}>₱</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          <View style={styles.limitRow}>
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>Min ₱100</Text>
            </View>
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>Max ₱50,000</Text>
            </View>
          </View>
        </View>

        {/* Presets */}
        <Text style={styles.sectionLabel}>Quick Select</Text>
        <View style={styles.presetGrid}>
          {PRESETS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.presetBtn, numAmount === a && styles.presetBtnActive]}
              onPress={() => setAmount(String(a))}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, numAmount === a && styles.presetTextActive]}>
                {formatCurrency(a)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        {isValid && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount to load</Text>
              <Text style={styles.summaryValue}>{formatCurrency(numAmount)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: COLORS.text, fontWeight: "700" }]}>Total</Text>
              <Text style={styles.summaryTotal}>{formatCurrency(numAmount)}</Text>
            </View>
            <View style={styles.paymentNote}>
              <Text style={styles.paymentNoteText}>
                You'll be redirected to complete payment via GCash, Maya, or card.
              </Text>
            </View>
          </View>
        )}

        <Button
          title="Proceed to Payment"
          onPress={handleFund}
          loading={loading}
          disabled={!isValid}
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  amountCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  amountCardLabel: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textSecondary, marginBottom: SPACING.md },
  amountRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.md },
  pesoSign: { fontSize: 36, fontWeight: "800", color: COLORS.textMuted, marginRight: SPACING.sm },
  amountInput: { flex: 1, fontSize: 40, fontWeight: "800", color: COLORS.text, padding: 0 },
  limitRow: { flexDirection: "row", gap: SPACING.sm },
  limitBadge: {
    backgroundColor: COLORS.surfaceHighlight, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
  },
  limitText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: "600" },
  sectionLabel: {
    fontSize: FONT_SIZE.xs, fontWeight: "700", color: COLORS.textMuted,
    marginBottom: SPACING.sm, textTransform: "uppercase", letterSpacing: 1,
  },
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg },
  presetBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, minWidth: "30%", alignItems: "center",
  },
  presetBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  presetText: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textSecondary },
  presetTextActive: { color: COLORS.primary },
  summaryCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  summaryTitle: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm },
  summaryLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  summaryTotal: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.primary },
  paymentNote: {
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginTop: SPACING.sm,
  },
  paymentNoteText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 18 },
});

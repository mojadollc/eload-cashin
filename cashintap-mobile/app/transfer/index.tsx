import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, TextInput,
} from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { walletApi, transferApi } from "@/api/endpoints";
import { useWallet } from "@/hooks/useWallet";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";
import { formatCurrency } from "@/utils/helpers";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export default function TransferScreen() {
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: wallet } = useWallet();

  const handleLookup = async () => {
    if (!accountNumber.trim()) return;
    setLookingUp(true);
    setRecipient(null);
    try {
      const res = await walletApi.lookup(accountNumber.trim());
      setRecipient(res.data.data);
    } catch {
      Toast.show({ type: "error", text1: "Account not found" });
    } finally { setLookingUp(false); }
  };

  const handleTransfer = () => {
    const num = parseFloat(amount);
    if (!recipient) { Toast.show({ type: "error", text1: "Look up recipient first" }); return; }
    if (!num || num < 1) { Toast.show({ type: "error", text1: "Enter a valid amount" }); return; }
    if (num > parseFloat(wallet?.availableBalance || "0")) {
      Toast.show({ type: "error", text1: "Insufficient balance" }); return;
    }
    Alert.alert(
      "Confirm Transfer",
      `Send ${formatCurrency(num)} to ${recipient.name}?`,
      [{ text: "Cancel", style: "cancel" }, { text: "Send", onPress: doTransfer }]
    );
  };

  const doTransfer = async () => {
    setLoading(true);
    try {
      const res = await transferApi.transfer(accountNumber, parseFloat(amount));
      Toast.show({ type: "success", text1: "Transfer successful!" });
      router.push({ pathname: "/transactions/[id]", params: { id: res.data.data.transactionNumber } });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.error || "Transfer failed" });
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Transfer Money" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Balance */}
        <View style={styles.balanceRow}>
          <Ionicons name="wallet-outline" size={15} color={COLORS.primary} />
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(wallet?.availableBalance || "0")}</Text>
        </View>

        {/* Recipient */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recipient</Text>
          <View style={styles.lookupRow}>
            <Input
              placeholder="Enter account number"
              value={accountNumber}
              onChangeText={(v) => { setAccountNumber(v); setRecipient(null); }}
              keyboardType="number-pad"
              containerStyle={{ flex: 1, marginBottom: 0, marginRight: SPACING.sm }}
              leftIcon="card-outline"
            />
            <TouchableOpacity onPress={handleLookup} style={styles.findBtn} disabled={lookingUp || !accountNumber.trim()}>
              {lookingUp
                ? <ActivityIndicator color={COLORS.white} size="small" />
                : <Text style={styles.findBtnText}>Find</Text>}
            </TouchableOpacity>
          </View>

          {recipient && (
            <View style={styles.recipientCard}>
              <View style={styles.recipientAvatar}>
                <Text style={styles.recipientInitial}>{recipient.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName}>{recipient.name}</Text>
                <Text style={styles.recipientAccount}>{accountNumber}</Text>
              </View>
              <View style={styles.recipientCheck}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
            </View>
          )}
        </View>

        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Amount</Text>
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
          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.quickBtn, parseFloat(amount) === a && styles.quickBtnActive]}
                onPress={() => setAmount(String(a))}
              >
                <Text style={[styles.quickText, parseFloat(amount) === a && styles.quickTextActive]}>
                  ₱{a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        {recipient && amount && parseFloat(amount) >= 1 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>To</Text>
              <Text style={styles.summaryValue}>{recipient.name}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryTotal}>{formatCurrency(parseFloat(amount) || 0)}</Text>
            </View>
          </View>
        )}

        <Button
          title="Send Money"
          onPress={handleTransfer}
          loading={loading}
          disabled={!recipient || !amount || parseFloat(amount) < 1}
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  balanceRow: {
    flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.primary + "25",
  },
  balanceLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, flex: 1 },
  balanceAmount: { fontSize: FONT_SIZE.lg, fontWeight: "800", color: COLORS.primary },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
  lookupRow: { flexDirection: "row", alignItems: "center" },
  findBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 52,
    alignItems: "center", justifyContent: "center", minWidth: 64,
  },
  findBtnText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZE.sm },
  recipientCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.successLight, borderRadius: RADIUS.md,
    padding: SPACING.md, marginTop: SPACING.md, gap: SPACING.md,
    borderWidth: 1, borderColor: COLORS.success + "30",
  },
  recipientAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
  },
  recipientInitial: { fontSize: FONT_SIZE.lg, fontWeight: "800", color: COLORS.white },
  recipientInfo: { flex: 1 },
  recipientName: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
  recipientAccount: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  recipientCheck: {},
  amountRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.md },
  pesoSign: { fontSize: 32, fontWeight: "800", color: COLORS.textMuted, marginRight: SPACING.sm },
  amountInput: { flex: 1, fontSize: 36, fontWeight: "800", color: COLORS.text, padding: 0 },
  quickAmounts: { flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" },
  quickBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
  },
  quickBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  quickText: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textSecondary },
  quickTextActive: { color: COLORS.primary },
  summaryCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  summaryLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text },
  summaryTotal: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.primary },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { walletApi, transferApi } from "@/api/endpoints";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS, SHADOW } from "@/utils/theme";
import { formatCurrency } from "@/utils/helpers";

export default function TransferScreen() {
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletApi.getWallet().then((r) => r.data.data),
  });

  const handleLookup = async () => {
    if (!accountNumber.trim()) return;
    setLookingUp(true);
    setRecipient(null);
    try {
      const res = await walletApi.lookup(accountNumber.trim());
      setRecipient(res.data.data);
    } catch {
      Toast.show({ type: "error", text1: "Account not found" });
    } finally {
      setLookingUp(false);
    }
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
      `Send ${formatCurrency(num)} to ${recipient.name}?\n\nAccount: ${accountNumber}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: doTransfer },
      ]
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Transfer Money" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balance}>{formatCurrency(wallet?.availableBalance || "0")}</Text>
        </View>

        {/* Recipient */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recipient</Text>
          <View style={styles.lookupRow}>
            <Input
              placeholder="Enter account number"
              value={accountNumber}
              onChangeText={(v) => { setAccountNumber(v); setRecipient(null); }}
              keyboardType="number-pad"
              containerStyle={{ flex: 1, marginBottom: 0, marginRight: SPACING.sm }}
              leftIcon="card-outline"
            />
            <TouchableOpacity onPress={handleLookup} style={styles.lookupBtn} disabled={lookingUp}>
              {lookingUp ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.lookupBtnText}>Find</Text>
              )}
            </TouchableOpacity>
          </View>

          {recipient && (
            <View style={styles.recipientCard}>
              <View style={styles.recipientAvatar}>
                <Text style={styles.recipientInitial}>{recipient.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.recipientName}>{recipient.name}</Text>
                <Text style={styles.recipientAccount}>{accountNumber}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.peso}>₱</Text>
            <Input
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              containerStyle={{ flex: 1, marginBottom: 0 }}
              style={{ fontSize: 26, fontWeight: "700" } as any}
            />
          </View>
        </View>

        <Button
          title="Transfer Now"
          onPress={handleTransfer}
          loading={loading}
          disabled={!recipient || !amount}
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
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: "center",
  },
  balanceLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  balance: { fontSize: 30, fontWeight: "800", color: COLORS.white, marginTop: 4 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOW.sm, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
  lookupRow: { flexDirection: "row", alignItems: "center" },
  lookupBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  lookupBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  recipientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  recipientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  recipientInitial: { fontSize: 18, fontWeight: "800", color: COLORS.white },
  recipientName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  recipientAccount: { fontSize: 12, color: COLORS.textSecondary },
  amountRow: { flexDirection: "row", alignItems: "center" },
  peso: { fontSize: 26, fontWeight: "700", color: COLORS.text, marginRight: SPACING.xs },
  btn: { marginTop: SPACING.sm },
});

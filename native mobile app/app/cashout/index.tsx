import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { cashoutApi, walletApi } from "@/api/endpoints";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS } from "@/utils/theme";
import { formatCurrency } from "@/utils/helpers";

const CHANNELS = [
  { id: "GCASH", label: "GCash", color: "#0066FF" },
  { id: "MAYA", label: "Maya", color: "#00A651" },
  { id: "BDO", label: "BDO", color: "#003087" },
  { id: "BPI", label: "BPI", color: "#CC0000" },
  { id: "METROBANK", label: "Metrobank", color: "#FFB800" },
  { id: "UNIONBANK", label: "UnionBank", color: "#E87722" },
  { id: "LANDBANK", label: "Landbank", color: "#006400" },
  { id: "PNB", label: "PNB", color: "#003087" },
];

export default function CashoutScreen() {
  const [channel, setChannel] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletApi.getWallet().then((r) => r.data.data),
  });

  const { data: destinations } = useQuery({
    queryKey: ["cashout-destinations"],
    queryFn: () => cashoutApi.getDestinations().then((r) => r.data.data),
  });

  const fillDestination = (dest: any) => {
    setChannel(dest.channel);
    setAccountNumber(dest.accountNumber);
    setAccountName(dest.accountName);
  };

  const handleCashout = () => {
    const num = parseFloat(amount);
    if (!channel) { Toast.show({ type: "error", text1: "Select a channel" }); return; }
    if (!accountNumber) { Toast.show({ type: "error", text1: "Enter account number" }); return; }
    if (!accountName) { Toast.show({ type: "error", text1: "Enter account name" }); return; }
    if (!num || num < 5) { Toast.show({ type: "error", text1: "Minimum cashout is ₱5" }); return; }
    if (num > parseFloat(wallet?.availableBalance || "0")) {
      Toast.show({ type: "error", text1: "Insufficient balance" }); return;
    }
    Alert.alert(
      "Confirm Cash Out",
      `Send ${formatCurrency(num)} to ${accountName} (${channel} ${accountNumber})?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: doCashout },
      ]
    );
  };

  const doCashout = async () => {
    setLoading(true);
    try {
      await cashoutApi.request({ amount: parseFloat(amount), channel, accountNumber, accountName });
      Toast.show({ type: "success", text1: "Cash out request submitted!", text2: "Processing may take a few minutes." });
      router.push("/(tabs)/transactions");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.error || "Cash out failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Cash Out" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balance}>{formatCurrency(wallet?.availableBalance || "0")}</Text>
        </View>

        {/* Saved Destinations */}
        {destinations?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Accounts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {destinations.map((d: any) => (
                <TouchableOpacity key={d.id} style={styles.destCard} onPress={() => fillDestination(d)}>
                  <Text style={styles.destChannel}>{d.channel}</Text>
                  <Text style={styles.destName} numberOfLines={1}>{d.accountName}</Text>
                  <Text style={styles.destAccount}>{d.accountNumber}</Text>
                  {d.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Channel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Channel</Text>
          <View style={styles.channelGrid}>
            {CHANNELS.map((c) => {
              const active = channel === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.channelBtn, active && { borderColor: c.color, backgroundColor: c.color + "20" }]}
                  onPress={() => setChannel(c.id)}
                >
                  <View style={[styles.channelDot, { backgroundColor: c.color }]} />
                  <Text style={[styles.channelLabel, active && { color: c.color }]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.card}>
          <Input
            label="Account Number / Mobile"
            placeholder="Enter account number"
            keyboardType="number-pad"
            value={accountNumber}
            onChangeText={setAccountNumber}
            leftIcon="card-outline"
          />
          <Input
            label="Account Name"
            placeholder="Full name on account"
            value={accountName}
            onChangeText={setAccountName}
            leftIcon="person-outline"
          />
          <Input
            label="Amount"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            leftIcon="cash-outline"
          />
        </View>

        <Button
          title="Request Cash Out"
          onPress={handleCashout}
          loading={loading}
          disabled={!channel || !accountNumber || !accountName || !amount}
          size="lg"
          style={styles.btn}
        />

        <TouchableOpacity onPress={() => router.push("/cashout/destinations")} style={styles.manageLink}>
          <Ionicons name="bookmark-outline" size={16} color={COLORS.primary} />
          <Text style={styles.manageLinkText}>Manage Saved Accounts</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  circle1: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -50,
    right: -30,
  },
  circle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: 10,
  },
  balanceLabel: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  balance: { fontSize: 34, fontWeight: "800", color: COLORS.white, marginTop: 4 },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, marginBottom: SPACING.sm, textTransform: "uppercase", letterSpacing: 0.5 },
  destCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    minWidth: 130,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  destChannel: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  destName: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginTop: 2 },
  destAccount: { fontSize: 11, color: COLORS.textMuted },
  defaultBadge: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, alignSelf: "flex-start" },
  defaultText: { fontSize: 10, color: COLORS.primary, fontWeight: "700" },
  channelGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  channelBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: SPACING.xs,
  },
  channelDot: { width: 8, height: 8, borderRadius: 4 },
  channelLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  btn: { marginTop: SPACING.sm },
  manageLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.xs, marginTop: SPACING.md },
  manageLinkText: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
});

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
import { COLORS, SPACING, RADIUS, SHADOW } from "@/utils/theme";
import { formatCurrency } from "@/utils/helpers";

const CHANNELS = [
  { id: "GCASH", label: "GCash", icon: "💙" },
  { id: "MAYA", label: "Maya", icon: "💚" },
  { id: "BDO", label: "BDO", icon: "🏦" },
  { id: "BPI", label: "BPI", icon: "🏦" },
  { id: "METROBANK", label: "Metrobank", icon: "🏦" },
  { id: "UNIONBANK", label: "UnionBank", icon: "🏦" },
  { id: "LANDBANK", label: "Landbank", icon: "🏦" },
  { id: "PNB", label: "PNB", icon: "🏦" },
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

        {/* Balance */}
        <View style={styles.balanceCard}>
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
                  {d.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Channel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Channel</Text>
          <View style={styles.channelGrid}>
            {CHANNELS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.channelBtn, channel === c.id && styles.channelBtnActive]}
                onPress={() => setChannel(c.id)}
              >
                <Text style={styles.channelIcon}>{c.icon}</Text>
                <Text style={[styles.channelLabel, channel === c.id && styles.channelLabelActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
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
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: "center",
  },
  balanceLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  balance: { fontSize: 30, fontWeight: "800", color: COLORS.white, marginTop: 4 },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.sm },
  destCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    minWidth: 130,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
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
  channelBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  channelIcon: { fontSize: 16 },
  channelLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  channelLabelActive: { color: COLORS.primary },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOW.sm, marginBottom: SPACING.lg },
  btn: { marginTop: SPACING.sm },
  manageLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.xs, marginTop: SPACING.md },
  manageLinkText: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
});

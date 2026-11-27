import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { cashoutApi } from "@/api/endpoints";
import { useWallet } from "@/hooks/useWallet";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS, FONT_SIZE, SHADOW } from "@/utils/theme";
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

  const { data: wallet } = useWallet();
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
      `Send ${formatCurrency(num)} to\n${accountName}\n${channel} · ${accountNumber}`,
      [{ text: "Cancel", style: "cancel" }, { text: "Confirm", onPress: doCashout }]
    );
  };

  const doCashout = async () => {
    setLoading(true);
    try {
      await cashoutApi.request({ amount: parseFloat(amount), channel, accountNumber, accountName });
      Toast.show({ type: "success", text1: "Cash out submitted!", text2: "Processing may take a few minutes." });
      router.push("/(tabs)/transactions");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.error || "Cash out failed" });
    } finally { setLoading(false); }
  };

  const selectedChannel = CHANNELS.find((c) => c.id === channel);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Cash Out" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCircle1} />
          <View style={styles.balanceCircle2} />
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(wallet?.availableBalance || "0")}</Text>
        </View>

        {/* Saved Destinations */}
        {destinations?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Saved Accounts</Text>
              <TouchableOpacity onPress={() => router.push("/cashout/destinations")}>
                <Text style={styles.sectionAction}>Manage</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destList}>
              {destinations.map((d: any) => (
                <TouchableOpacity key={d.id} style={[styles.destCard, channel === d.channel && accountNumber === d.accountNumber && styles.destCardActive]} onPress={() => fillDestination(d)} activeOpacity={0.7}>
                  <View style={[styles.destIcon, { backgroundColor: CHANNELS.find((c) => c.id === d.channel)?.color + "20" || COLORS.primaryLight }]}>
                    <Text style={[styles.destIconText, { color: CHANNELS.find((c) => c.id === d.channel)?.color || COLORS.primary }]}>
                      {d.channel[0]}
                    </Text>
                  </View>
                  <Text style={styles.destChannel}>{d.channel}</Text>
                  <Text style={styles.destName} numberOfLines={1}>{d.accountName}</Text>
                  {d.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Channel */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Channel</Text>
          <View style={styles.channelGrid}>
            {CHANNELS.map((c) => {
              const active = channel === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.channelBtn, active && { borderColor: c.color, backgroundColor: c.color + "15" }]}
                  onPress={() => setChannel(c.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.channelDot, { backgroundColor: c.color }]} />
                  <Text style={[styles.channelLabel, active && { color: c.color, fontWeight: "700" }]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
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
            hint="Minimum ₱5"
          />
        </View>

        {/* Summary */}
        {channel && accountNumber && amount && parseFloat(amount) >= 5 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Channel</Text>
              <View style={styles.summaryChannelBadge}>
                <View style={[styles.channelDot, { backgroundColor: selectedChannel?.color || COLORS.primary }]} />
                <Text style={styles.summaryValue}>{selectedChannel?.label || channel}</Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>You'll receive</Text>
              <Text style={[styles.summaryValue, styles.summaryTotal]}>{formatCurrency(parseFloat(amount) || 0)}</Text>
            </View>
          </View>
        )}

        <Button
          title="Request Cash Out"
          onPress={handleCashout}
          loading={loading}
          disabled={!channel || !accountNumber || !accountName || !amount}
          size="lg"
        />

        <TouchableOpacity onPress={() => router.push("/cashout/destinations")} style={styles.manageLink}>
          <Ionicons name="bookmark-outline" size={15} color={COLORS.primary} />
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
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.lg, alignItems: "center",
    overflow: "hidden", ...SHADOW.glow,
  },
  balanceCircle1: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -30 },
  balanceCircle2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: 10 },
  balanceLabel: { fontSize: FONT_SIZE.sm, color: "rgba(255,255,255,0.75)" },
  balanceAmount: { fontSize: FONT_SIZE.display, fontWeight: "800", color: COLORS.white, marginTop: 4, letterSpacing: -1 },
  section: { marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm },
  sectionLabel: { fontSize: FONT_SIZE.xs, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  sectionAction: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: "600" },
  destList: { gap: SPACING.sm },
  destCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, minWidth: 120, borderWidth: 1, borderColor: COLORS.border, alignItems: "center",
  },
  destCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  destIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  destIconText: { fontSize: FONT_SIZE.lg, fontWeight: "800" },
  destChannel: { fontSize: FONT_SIZE.xs, fontWeight: "700", color: COLORS.primary },
  destName: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2, maxWidth: 100 },
  defaultBadge: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  defaultText: { fontSize: 9, color: COLORS.primary, fontWeight: "700" },
  channelGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  channelBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  channelDot: { width: 8, height: 8, borderRadius: 4 },
  channelLabel: { fontSize: FONT_SIZE.sm, fontWeight: "500", color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
  summaryCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  summaryLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  summaryChannelBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryValue: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text },
  summaryTotal: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.primary },
  manageLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: SPACING.lg },
  manageLinkText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: "600" },
});

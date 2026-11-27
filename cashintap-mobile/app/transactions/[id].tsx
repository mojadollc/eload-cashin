import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { transactionApi } from "@/api/endpoints";
import Header from "@/components/Header";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";
import { formatCurrency, formatDateTime, getStatusColor, getTransactionIcon } from "@/utils/helpers";

const TYPE_LABELS: Record<string, string> = {
  WALLET_FUND: "Wallet Funding", ELOAD: "E-Load", CASHOUT: "Cash Out",
  TRANSFER: "Transfer", TRANSFER_IN: "Money Received", TRANSFER_OUT: "Money Sent",
  REFUND: "Refund", REVERSAL: "Reversal", ADMIN_ADJUSTMENT: "Adjustment", FEE: "Service Fee",
};

const TYPE_COLORS: Record<string, string> = {
  WALLET_FUND: COLORS.success, REFUND: COLORS.success, REVERSAL: COLORS.info,
  TRANSFER_IN: COLORS.success, ELOAD: COLORS.warning, CASHOUT: COLORS.danger,
  TRANSFER: COLORS.primary, TRANSFER_OUT: COLORS.danger, FEE: COLORS.textMuted,
  ADMIN_ADJUSTMENT: COLORS.primary,
};

function DetailRow({ label, value, onCopy, highlight }: {
  label: string; value: string; onCopy?: () => void; highlight?: boolean;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <View style={rowStyles.valueWrap}>
        <Text style={[rowStyles.value, highlight && rowStyles.valueHighlight]} numberOfLines={2}>
          {value}
        </Text>
        {onCopy && (
          <TouchableOpacity onPress={onCopy} style={rowStyles.copyBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailCardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: txn, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => transactionApi.getById(id).then((r) => r.data.data),
  });

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show({ type: "success", text1: "Copied!" });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Transaction" />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      </View>
    );
  }

  if (!txn) return null;

  const isCredit = ["WALLET_FUND", "REFUND", "REVERSAL", "TRANSFER_IN"].includes(txn.type);
  const statusColor = getStatusColor(txn.status);
  const iconColor = TYPE_COLORS[txn.type] || COLORS.primary;

  return (
    <View style={styles.container}>
      <Header title="Transaction" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Status Hero */}
        <View style={styles.heroCard}>
          <View style={[styles.heroIcon, { backgroundColor: iconColor + "18" }]}>
            <Ionicons name={getTransactionIcon(txn.type) as any} size={34} color={iconColor} />
          </View>
          <Text style={styles.heroType}>{TYPE_LABELS[txn.type] || txn.type}</Text>
          <Text style={[styles.heroAmount, { color: isCredit ? COLORS.success : COLORS.text }]}>
            {isCredit ? "+" : "−"}{formatCurrency(txn.grossAmount)}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + "18", borderColor: statusColor + "35" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{txn.status}</Text>
          </View>
        </View>

        {/* Core Details */}
        <SectionCard title="Transaction Details">
          <DetailRow label="Reference No." value={txn.transactionNumber} onCopy={() => copy(txn.transactionNumber)} />
          <DetailRow label="Date & Time" value={formatDateTime(txn.createdAt)} />
          <DetailRow label="Gross Amount" value={formatCurrency(txn.grossAmount)} />
          {parseFloat(txn.feeAmount) > 0 && (
            <DetailRow label="Service Fee" value={formatCurrency(txn.feeAmount)} />
          )}
          <DetailRow label="Net Amount" value={formatCurrency(txn.netAmount)} highlight />
          {txn.provider && <DetailRow label="Provider" value={txn.provider} />}
        </SectionCard>

        {txn.eloadTxn && (
          <SectionCard title="E-Load Details">
            <DetailRow label="Mobile Number" value={txn.eloadTxn.mobileNumber} />
            <DetailRow label="Network" value={txn.eloadTxn.network} />
            <DetailRow label="Product" value={txn.eloadTxn.productCode} />
          </SectionCard>
        )}

        {txn.cashoutTxn && (
          <SectionCard title="Cash Out Details">
            <DetailRow label="Channel" value={txn.cashoutTxn.channel} />
            <DetailRow label="Account Number" value={txn.cashoutTxn.accountNumber} />
            <DetailRow label="Account Name" value={txn.cashoutTxn.accountName} />
            <DetailRow label="Status" value={txn.cashoutTxn.cashoutStatus} />
          </SectionCard>
        )}

        {txn.fundingTxn && (
          <SectionCard title="Funding Details">
            <DetailRow label="Payment Method" value={txn.fundingTxn.paymentMethod || "—"} />
          </SectionCard>
        )}

        {txn.transferTxn && (
          <SectionCard title="Transfer Details">
            <DetailRow label="From" value={txn.transferTxn.senderAccount || "—"} />
            <DetailRow label="To" value={txn.transferTxn.recipientAccount || "—"} />
            <DetailRow label="Recipient" value={txn.transferTxn.recipientName || "—"} />
          </SectionCard>
        )}
      </ScrollView>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  label: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, flex: 1 },
  valueWrap: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, flex: 1.5, justifyContent: "flex-end" },
  value: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text, textAlign: "right", flex: 1 },
  valueHighlight: { fontSize: FONT_SIZE.lg, fontWeight: "800", color: COLORS.primary },
  copyBtn: { padding: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  heroCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.xl, alignItems: "center",
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  heroIcon: { width: 80, height: 80, borderRadius: RADIUS.xl, alignItems: "center", justifyContent: "center" },
  heroType: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textSecondary },
  heroAmount: { fontSize: 38, fontWeight: "800", letterSpacing: -1 },
  statusPill: {
    flexDirection: "row", alignItems: "center", borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 7, gap: 7, borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: FONT_SIZE.sm, fontWeight: "700" },
  detailCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  detailCardTitle: {
    fontSize: FONT_SIZE.xs, fontWeight: "700", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: SPACING.sm,
  },
});

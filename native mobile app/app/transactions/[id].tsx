import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { transactionApi } from "@/api/endpoints";
import Header from "@/components/Header";
import { COLORS, SPACING, RADIUS, SHADOW } from "@/utils/theme";
import { formatCurrency, formatDateTime, getStatusColor, getTransactionIcon } from "@/utils/helpers";

const TYPE_LABELS: Record<string, string> = {
  WALLET_FUND: "Wallet Funding",
  ELOAD: "E-Load",
  CASHOUT: "Cash Out",
  REFUND: "Refund",
  REVERSAL: "Reversal",
  ADMIN_ADJUSTMENT: "Adjustment",
  FEE: "Fee",
};

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: txn, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => transactionApi.getById(id).then((r) => r.data.data),
  });

  const copyRef = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show({ type: "success", text1: "Copied to clipboard" });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Header title="Transaction Details" />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      </View>
    );
  }

  if (!txn) return null;

  const isCredit = txn.type === "WALLET_FUND" || txn.type === "REFUND" || txn.type === "REVERSAL";
  const statusColor = getStatusColor(txn.status);

  return (
    <View style={styles.container}>
      <Header title="Transaction Details" />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.iconCircle, { backgroundColor: isCredit ? "#E8FFF4" : "#FFF0F0" }]}>
            <Ionicons
              name={getTransactionIcon(txn.type) as any}
              size={32}
              color={isCredit ? COLORS.success : COLORS.danger}
            />
          </View>
          <Text style={styles.txnType}>{TYPE_LABELS[txn.type] || txn.type}</Text>
          <Text style={[styles.amount, { color: isCredit ? COLORS.success : COLORS.text }]}>
            {isCredit ? "+" : "-"}{formatCurrency(txn.grossAmount)}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + "20" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{txn.status}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <DetailRow label="Reference No." value={txn.transactionNumber} onCopy={() => copyRef(txn.transactionNumber)} />
          <DetailRow label="Date & Time" value={formatDateTime(txn.createdAt)} />
          <DetailRow label="Gross Amount" value={formatCurrency(txn.grossAmount)} />
          {parseFloat(txn.feeAmount) > 0 && (
            <DetailRow label="Fee" value={formatCurrency(txn.feeAmount)} />
          )}
          <DetailRow label="Net Amount" value={formatCurrency(txn.netAmount)} highlight />
          {txn.provider && <DetailRow label="Provider" value={txn.provider} />}
        </View>

        {/* E-Load Details */}
        {txn.eloadTxn && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>E-Load Details</Text>
            <DetailRow label="Mobile Number" value={txn.eloadTxn.mobileNumber} />
            <DetailRow label="Network" value={txn.eloadTxn.network} />
            <DetailRow label="Product" value={txn.eloadTxn.productCode} />
          </View>
        )}

        {/* Cashout Details */}
        {txn.cashoutTxn && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Cash Out Details</Text>
            <DetailRow label="Channel" value={txn.cashoutTxn.channel} />
            <DetailRow label="Account Number" value={txn.cashoutTxn.accountNumber} />
            <DetailRow label="Account Name" value={txn.cashoutTxn.accountName} />
            <DetailRow label="Status" value={txn.cashoutTxn.cashoutStatus} />
          </View>
        )}

        {/* Funding Details */}
        {txn.fundingTxn && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Funding Details</Text>
            <DetailRow label="Payment Method" value={txn.fundingTxn.paymentMethod || "—"} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, onCopy, highlight }: { label: string; value: string; onCopy?: () => void; highlight?: boolean }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <View style={detailStyles.valueRow}>
        <Text style={[detailStyles.value, highlight && detailStyles.valueHighlight]}>{value}</Text>
        {onCopy && (
          <TouchableOpacity onPress={onCopy} style={detailStyles.copyBtn}>
            <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  valueRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, flex: 1, justifyContent: "flex-end" },
  value: { fontSize: 13, fontWeight: "600", color: COLORS.text, textAlign: "right" },
  valueHighlight: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  copyBtn: { padding: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    marginBottom: SPACING.lg,
    ...SHADOW.md,
  },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md },
  txnType: { fontSize: 16, fontWeight: "600", color: COLORS.textSecondary, marginBottom: SPACING.sm },
  amount: { fontSize: 32, fontWeight: "800", marginBottom: SPACING.md },
  statusPill: { flexDirection: "row", alignItems: "center", borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 6, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: "700" },
  detailsCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.sm },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.sm },
});

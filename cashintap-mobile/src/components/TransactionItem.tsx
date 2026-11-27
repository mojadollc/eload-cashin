import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, FONT_SIZE } from "@/utils/theme";
import { formatCurrency, formatDateTime, getTransactionIcon, getStatusColor } from "@/utils/helpers";

interface TransactionItemProps {
  transaction: {
    id: string;
    transactionNumber: string;
    type: string;
    status: string;
    grossAmount: string;
    feeAmount: string;
    netAmount: string;
    createdAt: string;
    eloadTxn?: { mobileNumber: string; network: string } | null;
    cashoutTxn?: { channel: string; accountNumber: string } | null;
    fundingTxn?: { paymentMethod: string } | null;
  };
  onPress?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  WALLET_FUND: "Wallet Funding",
  ELOAD: "E-Load",
  CASHOUT: "Cash Out",
  TRANSFER: "Transfer",
  TRANSFER_IN: "Money Received",
  TRANSFER_OUT: "Money Sent",
  REFUND: "Refund",
  REVERSAL: "Reversal",
  ADMIN_ADJUSTMENT: "Adjustment",
  FEE: "Service Fee",
};

const TYPE_COLORS: Record<string, string> = {
  WALLET_FUND: COLORS.success,
  REFUND: COLORS.success,
  REVERSAL: COLORS.info,
  TRANSFER_IN: COLORS.success,
  ELOAD: COLORS.warning,
  CASHOUT: COLORS.danger,
  TRANSFER: COLORS.primary,
  TRANSFER_OUT: COLORS.danger,
  FEE: COLORS.textMuted,
  ADMIN_ADJUSTMENT: COLORS.primary,
};

function getSubtitle(t: TransactionItemProps["transaction"]): string {
  if (t.eloadTxn) return `${t.eloadTxn.network} · ${t.eloadTxn.mobileNumber}`;
  if (t.cashoutTxn) return `${t.cashoutTxn.channel} · ${t.cashoutTxn.accountNumber}`;
  if (t.fundingTxn?.paymentMethod) return t.fundingTxn.paymentMethod;
  return t.transactionNumber;
}

export default function TransactionItem({ transaction: t, onPress }: TransactionItemProps) {
  const isCredit = ["WALLET_FUND", "REFUND", "REVERSAL", "TRANSFER_IN"].includes(t.type);
  const iconColor = TYPE_COLORS[t.type] || COLORS.primary;
  const statusColor = getStatusColor(t.status);

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.65}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + "18" }]}>
        <Ionicons name={getTransactionIcon(t.type) as any} size={19} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.type}>{TYPE_LABELS[t.type] || t.type}</Text>
        <Text style={styles.sub} numberOfLines={1}>{getSubtitle(t)}</Text>
        <Text style={styles.date}>{formatDateTime(t.createdAt)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isCredit ? COLORS.success : COLORS.text }]}>
          {isCredit ? "+" : "−"}{formatCurrency(parseFloat(t.grossAmount))}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{t.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1, gap: 2 },
  type: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text },
  sub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  date: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  right: { alignItems: "flex-end", gap: 5, flexShrink: 0 },
  amount: { fontSize: FONT_SIZE.md, fontWeight: "700" },
  statusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
});

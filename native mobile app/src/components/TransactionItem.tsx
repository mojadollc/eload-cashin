import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, SHADOW } from "@/utils/theme";
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
  REFUND: "Refund",
  REVERSAL: "Reversal",
  ADMIN_ADJUSTMENT: "Adjustment",
  FEE: "Fee",
};

export default function TransactionItem({ transaction: t, onPress }: TransactionItemProps) {
  const isCredit = t.type === "WALLET_FUND" || t.type === "REFUND" || t.type === "REVERSAL";
  const amount = parseFloat(t.grossAmount);

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor: isCredit ? "#E8FFF4" : "#FFF0F0" }]}>
        <Ionicons
          name={getTransactionIcon(t.type) as any}
          size={20}
          color={isCredit ? COLORS.success : COLORS.danger}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.type}>{TYPE_LABELS[t.type] || t.type}</Text>
        <Text style={styles.ref} numberOfLines={1}>{t.transactionNumber}</Text>
        <Text style={styles.date}>{formatDateTime(t.createdAt)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isCredit ? COLORS.success : COLORS.text }]}>
          {isCredit ? "+" : "-"}{formatCurrency(amount)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(t.status) + "20" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(t.status) }]}>{t.status}</Text>
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
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  info: { flex: 1 },
  type: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  ref: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  date: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  right: { alignItems: "flex-end" },
  amount: { fontSize: 15, fontWeight: "700" },
  statusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: "600" },
});

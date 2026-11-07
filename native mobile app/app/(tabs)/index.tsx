import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { walletApi, transactionApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import TransactionItem from "@/components/TransactionItem";
import { COLORS, SPACING, RADIUS, SHADOW } from "@/utils/theme";
import { formatCurrency } from "@/utils/helpers";

const QUICK_ACTIONS = [
  { label: "Fund", icon: "add-circle", color: "#0066FF", route: "/wallet/fund" },
  { label: "Transfer", icon: "swap-horizontal", color: "#00C896", route: "/transfer" },
  { label: "E-Load", icon: "phone-portrait", color: "#FF9500", route: "/eload" },
  { label: "Cash Out", icon: "arrow-up-circle", color: "#FF3B30", route: "/cashout" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletApi.getWallet().then((r) => r.data.data),
  });

  const { data: txData, isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: () => transactionApi.getAll({ limit: 5 }).then((r) => r.data.data),
  });

  const onRefresh = () => { refetchWallet(); refetchTx(); };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: SPACING.xl }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.name}>{user?.firstName} {user?.lastName} 👋</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/wallet/qr")} style={styles.qrBtn}>
          <Ionicons name="qr-code" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Available Balance</Text>
        {walletLoading ? (
          <ActivityIndicator color={COLORS.white} size="large" style={{ marginVertical: SPACING.md }} />
        ) : (
          <Text style={styles.balance}>{formatCurrency(wallet?.availableBalance || "0")}</Text>
        )}
        <View style={styles.walletRow}>
          <View>
            <Text style={styles.walletSubLabel}>Account No.</Text>
            <Text style={styles.walletSubValue}>{wallet?.accountNumber || "—"}</Text>
          </View>
          <View style={[styles.statusBadge, wallet?.status === "ACTIVE" ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>{wallet?.status || "—"}</Text>
          </View>
        </View>
        {wallet?.pendingBalance && parseFloat(wallet.pendingBalance) > 0 ? (
          <Text style={styles.pendingText}>Pending: {formatCurrency(wallet.pendingBalance)}</Text>
        ) : null}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionBtn}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + "15" }]}>
                <Ionicons name={action.icon as any} size={26} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {txLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
        ) : txData?.transactions?.length ? (
          txData.transactions.map((t: any) => (
            <TransactionItem
              key={t.id}
              transaction={t}
              onPress={() => router.push({ pathname: "/transactions/[id]", params: { id: t.id } })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  greeting: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  name: { fontSize: 18, fontWeight: "800", color: COLORS.white },
  qrBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletCard: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  walletLabel: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 4 },
  balance: { fontSize: 38, fontWeight: "800", color: COLORS.white, marginBottom: SPACING.md },
  walletRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletSubLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  walletSubValue: { fontSize: 14, fontWeight: "700", color: COLORS.white },
  statusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4 },
  statusActive: { backgroundColor: "rgba(52,199,89,0.25)" },
  statusInactive: { backgroundColor: "rgba(255,59,48,0.25)" },
  statusText: { fontSize: 12, fontWeight: "700", color: COLORS.white },
  pendingText: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: SPACING.sm },
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  actionsGrid: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: { alignItems: "center", flex: 1 },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
    ...SHADOW.sm,
  },
  actionLabel: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  emptyState: { alignItems: "center", paddingVertical: SPACING.xl },
  emptyIcon: { fontSize: 40, marginBottom: SPACING.sm },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});

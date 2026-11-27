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
  { label: "Fund", icon: "add-circle", color: COLORS.primary, bg: COLORS.primaryLight, route: "/wallet/fund" },
  { label: "Transfer", icon: "swap-horizontal", color: COLORS.accent, bg: COLORS.accentLight, route: "/transfer" },
  { label: "E-Load", icon: "phone-portrait", color: COLORS.warning, bg: "rgba(255,181,71,0.15)", route: "/eload" },
  { label: "Cash Out", icon: "arrow-up-circle", color: COLORS.danger, bg: "rgba(255,92,122,0.15)", route: "/cashout" },
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
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View>
          <Text style={styles.greeting}>Good day 👋</Text>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/wallet/qr")} style={styles.qrBtn}>
          <Ionicons name="qr-code-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Wallet Card */}
      <View style={styles.cardWrap}>
        <View style={styles.walletCard}>
          {/* Decorative circles */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />

          <Text style={styles.walletLabel}>Available Balance</Text>
          {walletLoading ? (
            <ActivityIndicator color={COLORS.white} size="large" style={{ marginVertical: SPACING.md }} />
          ) : (
            <Text style={styles.balance}>{formatCurrency(wallet?.availableBalance || "0")}</Text>
          )}

          <View style={styles.walletDivider} />

          <View style={styles.walletRow}>
            <View>
              <Text style={styles.walletSubLabel}>Account No.</Text>
              <Text style={styles.walletSubValue}>{wallet?.accountNumber || "—"}</Text>
            </View>
            <View style={[styles.statusBadge, wallet?.status === "ACTIVE" ? styles.statusActive : styles.statusInactive]}>
              <View style={[styles.statusDot, { backgroundColor: wallet?.status === "ACTIVE" ? COLORS.accent : COLORS.danger }]} />
              <Text style={styles.statusText}>{wallet?.status || "—"}</Text>
            </View>
          </View>

          {wallet?.pendingBalance && parseFloat(wallet.pendingBalance) > 0 ? (
            <Text style={styles.pendingText}>⏳ Pending: {formatCurrency(wallet.pendingBalance)}</Text>
          ) : null}
        </View>
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
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
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
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
            <Text style={styles.seeAll}>See All →</Text>
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
            <View style={styles.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={32} color={COLORS.textMuted} />
            </View>
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
    paddingBottom: SPACING.lg,
  },
  greeting: { fontSize: 13, color: COLORS.textSecondary },
  name: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginTop: 2 },
  qrBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardWrap: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  walletCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    overflow: "hidden",
    ...SHADOW.glow,
  },
  circle1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -60,
    right: -40,
  },
  circle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: 20,
  },
  walletLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6 },
  balance: { fontSize: 40, fontWeight: "800", color: COLORS.white, letterSpacing: -1 },
  walletDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: SPACING.md },
  walletRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletSubLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  walletSubValue: { fontSize: 14, fontWeight: "700", color: COLORS.white, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  statusActive: { backgroundColor: "rgba(0,229,160,0.2)" },
  statusInactive: { backgroundColor: "rgba(255,92,122,0.2)" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "700", color: COLORS.white },
  pendingText: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: SPACING.sm },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  actionsGrid: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: { alignItems: "center", flex: 1 },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  emptyState: { alignItems: "center", paddingVertical: SPACING.xl },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});

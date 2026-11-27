import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { transactionApi } from "@/api/endpoints";
import TransactionItem from "@/components/TransactionItem";
import EmptyState from "@/components/EmptyState";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";

const FILTERS = [
  { key: "All", label: "All" },
  { key: "WALLET_FUND", label: "Funding" },
  { key: "ELOAD", label: "E-Load" },
  { key: "CASHOUT", label: "Cash Out" },
  { key: "TRANSFER", label: "Transfer" },
];

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["transactions", filter, page],
    queryFn: () =>
      transactionApi
        .getAll({ type: filter === "All" ? undefined : filter, page, limit: 20 })
        .then((r) => r.data.data),
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Your transaction history</Text>
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            onPress={() => { setFilter(f.key); setPage(1); }}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.filterRow}
      />

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={data?.transactions || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() => router.push({ pathname: "/transactions/[id]", params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No transactions found"
              subtitle="Your transactions will appear here"
            />
          }
          ListFooterComponent={
            data?.pages > page ? (
              <TouchableOpacity onPress={() => setPage((p) => p + 1)} style={styles.loadMore}>
                <Text style={styles.loadMoreText}>Load more</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  title: { fontSize: FONT_SIZE.xxxl, fontWeight: "800", color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  filterRow: { flexGrow: 0, marginBottom: SPACING.sm },
  filterList: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  filterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 110 },
  loadMore: { alignItems: "center", paddingVertical: SPACING.lg },
  loadMoreText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: "600" },
});

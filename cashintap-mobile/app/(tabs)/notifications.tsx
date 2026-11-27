import React from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { notificationApi } from "@/api/endpoints";
import EmptyState from "@/components/EmptyState";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";
import { formatDateTime } from "@/utils/helpers";

const TYPE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  WALLET_FUND: { icon: "arrow-down-circle", color: COLORS.success },
  ELOAD: { icon: "phone-portrait", color: COLORS.warning },
  CASHOUT: { icon: "arrow-up-circle", color: COLORS.danger },
  TRANSFER: { icon: "swap-horizontal", color: COLORS.primary },
  TRANSFER_IN: { icon: "arrow-down-circle", color: COLORS.success },
  TRANSFER_OUT: { icon: "arrow-up-circle", color: COLORS.danger },
  SYSTEM: { icon: "information-circle", color: COLORS.info },
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getAll({ limit: 50 }).then((r) => r.data.data),
  });

  const markRead = useMutation({
    mutationFn: () => notificationApi.markRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data?.notifications || [];
  const unread = data?.unreadCount || 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unread > 0 && (
            <Text style={styles.subtitle}>{unread} unread message{unread > 1 ? "s" : ""}</Text>
          )}
        </View>
        {unread > 0 && (
          <TouchableOpacity
            onPress={() => markRead.mutate()}
            style={styles.markAllBtn}
            disabled={markRead.isPending}
          >
            <Ionicons name="checkmark-done-outline" size={15} color={COLORS.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type] || { icon: "notifications-outline" as any, color: COLORS.primary };
            return (
              <View style={[styles.item, !item.read && styles.itemUnread]}>
                <View style={[styles.iconWrap, { backgroundColor: meta.color + "18" }]}>
                  <Ionicons name={meta.icon} size={19} color={meta.color} />
                </View>
                <View style={styles.itemContent}>
                  <View style={styles.itemTop}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
                  <Text style={styles.itemTime}>{formatDateTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications yet"
              subtitle="You'll see updates about your transactions here"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md,
  },
  title: { fontSize: FONT_SIZE.xxxl, fontWeight: "800", color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  markAllBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    marginTop: 4,
  },
  markAllText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: "700" },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 110 },
  item: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md,
  },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  iconWrap: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  itemContent: { flex: 1, gap: 3 },
  itemTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemTitle: { fontSize: FONT_SIZE.sm, fontWeight: "700", color: COLORS.text, flex: 1 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: SPACING.sm },
  itemMessage: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 17 },
  itemTime: { fontSize: 10, color: COLORS.textMuted },
});

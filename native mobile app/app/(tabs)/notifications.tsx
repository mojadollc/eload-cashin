import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { notificationApi } from "@/api/endpoints";
import { COLORS, SPACING, RADIUS } from "@/utils/theme";
import { formatDateTime } from "@/utils/helpers";

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  WALLET_FUND: { icon: "arrow-down-circle", color: COLORS.success },
  ELOAD: { icon: "phone-portrait", color: COLORS.warning },
  CASHOUT: { icon: "arrow-up-circle", color: COLORS.danger },
  TRANSFER: { icon: "swap-horizontal", color: COLORS.primary },
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
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={() => markRead.mutate()} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unread > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="ellipse" size={8} color={COLORS.primary} />
          <Text style={styles.unreadText}>{unread} unread notification{unread > 1 ? "s" : ""}</Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={COLORS.primary} />}
          renderItem={({ item }) => {
            const meta = TYPE_ICONS[item.type] || { icon: "notifications", color: COLORS.primary };
            return (
              <View style={[styles.item, !item.read && styles.itemUnread]}>
                <View style={[styles.iconWrap, { backgroundColor: meta.color + "20" }]}>
                  <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                </View>
                <View style={styles.content}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.message}>{item.message}</Text>
                  <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
                </View>
                {!item.read && <View style={styles.dot} />}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={32} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: { fontSize: 26, fontWeight: "800", color: COLORS.text },
  markAllBtn: { paddingHorizontal: SPACING.sm },
  markAllText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    alignSelf: "flex-start",
  },
  unreadText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary, borderColor: COLORS.primary },
  iconWrap: { width: 42, height: 42, borderRadius: RADIUS.full, alignItems: "center", justifyContent: "center", marginRight: SPACING.md },
  content: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  message: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  time: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4 },
  empty: { alignItems: "center", paddingVertical: SPACING.xxl },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  emptyText: { fontSize: 15, color: COLORS.textMuted },
});

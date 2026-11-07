import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import Modal from "react-native-modal";
import { cashoutApi } from "@/api/endpoints";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS, SHADOW } from "@/utils/theme";

const CHANNELS = ["GCASH", "MAYA", "BDO", "BPI", "METROBANK", "UNIONBANK", "LANDBANK", "PNB"];

export default function DestinationsScreen() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [channel, setChannel] = useState("GCASH");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["cashout-destinations"],
    queryFn: () => cashoutApi.getDestinations().then((r) => r.data.data),
  });

  const addMutation = useMutation({
    mutationFn: () => cashoutApi.saveDestination({ channel, accountNumber, accountName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cashout-destinations"] });
      setShowModal(false);
      setAccountNumber("");
      setAccountName("");
      Toast.show({ type: "success", text1: "Account saved!" });
    },
    onError: (err: any) => Toast.show({ type: "error", text1: err.response?.data?.error || "Failed to save" }),
  });

  return (
    <View style={styles.container}>
      <Header
        title="Saved Accounts"
        rightAction={{ icon: "add", onPress: () => setShowModal(true) }}
      />

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.destCard}>
              <View style={styles.destLeft}>
                <View style={styles.destIcon}>
                  <Text style={styles.destIconText}>{item.channel[0]}</Text>
                </View>
                <View>
                  <View style={styles.destTitleRow}>
                    <Text style={styles.destChannel}>{item.channel}</Text>
                    {item.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
                  </View>
                  <Text style={styles.destName}>{item.accountName}</Text>
                  <Text style={styles.destAccount}>{item.accountNumber}</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>No saved accounts yet</Text>
              <Button title="Add Account" onPress={() => setShowModal(true)} variant="outline" style={{ marginTop: SPACING.md }} />
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal isVisible={showModal} onBackdropPress={() => setShowModal(false)} style={styles.modal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Account</Text>

          <Text style={styles.channelLabel}>Channel</Text>
          <View style={styles.channelRow}>
            {CHANNELS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.channelChip, channel === c && styles.channelChipActive]}
                onPress={() => setChannel(c)}
              >
                <Text style={[styles.channelChipText, channel === c && styles.channelChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Account Number" placeholder="Enter account number" keyboardType="number-pad" value={accountNumber} onChangeText={setAccountNumber} />
          <Input label="Account Name" placeholder="Full name" value={accountName} onChangeText={setAccountName} />

          <Button
            title="Save Account"
            onPress={() => addMutation.mutate()}
            loading={addMutation.isPending}
            disabled={!accountNumber || !accountName}
            size="lg"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg },
  destCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm },
  destLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  destIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
  destIconText: { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  destTitleRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  destChannel: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  destName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  destAccount: { fontSize: 12, color: COLORS.textMuted },
  defaultBadge: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2 },
  defaultText: { fontSize: 10, color: COLORS.primary, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: SPACING.xxl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: 15, color: COLORS.textMuted },
  modal: { justifyContent: "flex-end", margin: 0 },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.lg },
  channelLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: SPACING.sm },
  channelRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg },
  channelChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  channelChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  channelChipText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  channelChipTextActive: { color: COLORS.primary },
});

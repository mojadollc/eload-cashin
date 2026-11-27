import React, { useState } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Text } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { profileApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
});
type FormData = z.infer<typeof schema>;

export default function EditProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: user?.firstName || "", lastName: user?.lastName || "", email: user?.email || "" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await profileApi.update(data);
      updateUser(data);
      Toast.show({ type: "success", text1: "Profile updated!" });
      router.back();
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.error || "Update failed" });
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Edit Profile" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {`${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.avatarHint}>Profile photo coming soon</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <View style={styles.row}>
            <Controller control={control} name="firstName" render={({ field: { onChange, value } }) => (
              <Input label="First Name" value={value} onChangeText={onChange} error={errors.firstName?.message} containerStyle={{ flex: 1, marginRight: SPACING.sm }} />
            )} />
            <Controller control={control} name="lastName" render={({ field: { onChange, value } }) => (
              <Input label="Last Name" value={value} onChangeText={onChange} error={errors.lastName?.message} containerStyle={{ flex: 1 }} />
            )} />
          </View>
          <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
            <Input label="Email Address" value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" error={errors.email?.message} />
          )} />

          {/* Read-only mobile */}
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Mobile Number</Text>
            <View style={styles.readOnlyValue}>
              <Ionicons name="phone-portrait-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.readOnlyText}>{user?.mobile}</Text>
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={10} color={COLORS.textMuted} />
              </View>
            </View>
          </View>

          <Button title="Save Changes" onPress={handleSubmit(onSubmit)} loading={loading} size="lg" style={{ marginTop: SPACING.sm }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  avatarSection: { alignItems: "center", marginBottom: SPACING.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: COLORS.white },
  avatarHint: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.lg },
  row: { flexDirection: "row" },
  readOnlyField: { marginBottom: SPACING.md },
  readOnlyLabel: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 7 },
  readOnlyValue: {
    flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    backgroundColor: COLORS.surfaceHighlight, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  readOnlyText: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textMuted },
  lockedBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.surfaceElevated, alignItems: "center", justifyContent: "center",
  },
});

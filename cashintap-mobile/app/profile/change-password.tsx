import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "@/api/endpoints";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";

const schema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

const REQUIREMENTS = [
  { label: "At least 8 characters", regex: /.{8,}/ },
  { label: "One uppercase letter", regex: /[A-Z]/ },
  { label: "One number", regex: /[0-9]/ },
];

export default function ChangePasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [newPwValue, setNewPwValue] = useState("");

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchedNew = watch("newPassword", "");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      Toast.show({ type: "success", text1: "Password changed!" });
      router.back();
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.error || "Failed to change password" });
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Change Password" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <Controller control={control} name="currentPassword" render={({ field: { onChange, value } }) => (
            <Input label="Current Password" secureTextEntry value={value} onChangeText={onChange} leftIcon="lock-closed-outline" error={errors.currentPassword?.message} />
          )} />
          <Controller control={control} name="newPassword" render={({ field: { onChange, value } }) => (
            <Input label="New Password" secureTextEntry value={value} onChangeText={(v) => { onChange(v); setNewPwValue(v); }} leftIcon="lock-open-outline" error={errors.newPassword?.message} />
          )} />

          {/* Requirements */}
          {watchedNew.length > 0 && (
            <View style={styles.requirements}>
              {REQUIREMENTS.map((req) => {
                const met = req.regex.test(watchedNew);
                return (
                  <View key={req.label} style={styles.reqRow}>
                    <Ionicons
                      name={met ? "checkmark-circle" : "ellipse-outline"}
                      size={14}
                      color={met ? COLORS.success : COLORS.textMuted}
                    />
                    <Text style={[styles.reqText, met && styles.reqTextMet]}>{req.label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <Controller control={control} name="confirmPassword" render={({ field: { onChange, value } }) => (
            <Input label="Confirm New Password" secureTextEntry value={value} onChangeText={onChange} leftIcon="shield-checkmark-outline" error={errors.confirmPassword?.message} />
          )} />

          <Button title="Change Password" onPress={handleSubmit(onSubmit)} loading={loading} size="lg" style={{ marginTop: SPACING.sm }} />
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
          <Text style={styles.tipText}>
            Use a strong password with a mix of letters, numbers, and symbols. Never share your password with anyone.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
  },
  requirements: {
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md, gap: 8,
  },
  reqRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  reqText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  reqTextMet: { color: COLORS.success },
  tipCard: {
    flexDirection: "row", gap: SPACING.sm, alignItems: "flex-start",
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.info + "25",
  },
  tipText: { flex: 1, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 18 },
});

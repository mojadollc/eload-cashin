import React, { useState } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { authApi } from "@/api/endpoints";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS, SHADOW } from "@/utils/theme";

const schema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "Min 8 characters").regex(/[A-Z]/, "Must contain uppercase").regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

type FormData = z.infer<typeof schema>;

export default function ChangePasswordScreen() {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      Toast.show({ type: "success", text1: "Password changed successfully!" });
      router.back();
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.error || "Failed to change password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Change Password" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Controller control={control} name="currentPassword" render={({ field: { onChange, value } }) => (
            <Input label="Current Password" secureTextEntry value={value} onChangeText={onChange} leftIcon="lock-closed-outline" error={errors.currentPassword?.message} />
          )} />
          <Controller control={control} name="newPassword" render={({ field: { onChange, value } }) => (
            <Input label="New Password" secureTextEntry value={value} onChangeText={onChange} leftIcon="lock-open-outline" error={errors.newPassword?.message} />
          )} />
          <Controller control={control} name="confirmPassword" render={({ field: { onChange, value } }) => (
            <Input label="Confirm New Password" secureTextEntry value={value} onChangeText={onChange} leftIcon="lock-open-outline" error={errors.confirmPassword?.message} />
          )} />
          <Button title="Change Password" onPress={handleSubmit(onSubmit)} loading={loading} size="lg" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOW.sm },
});

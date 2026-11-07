import React, { useState } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { profileApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS, SHADOW } from "@/utils/theme";

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Edit Profile" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Controller control={control} name="firstName" render={({ field: { onChange, value } }) => (
            <Input label="First Name" value={value} onChangeText={onChange} error={errors.firstName?.message} />
          )} />
          <Controller control={control} name="lastName" render={({ field: { onChange, value } }) => (
            <Input label="Last Name" value={value} onChangeText={onChange} error={errors.lastName?.message} />
          )} />
          <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
            <Input label="Email" value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" error={errors.email?.message} />
          )} />
          <Button title="Save Changes" onPress={handleSubmit(onSubmit)} loading={loading} size="lg" />
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

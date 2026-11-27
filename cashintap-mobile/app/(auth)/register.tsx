import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import auth from "@/lib/firebase";
import { authApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/Button";
import Input from "@/components/Input";
import OtpInput from "@/components/OtpInput";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  mobile: z.string().regex(/^09\d{9}$/, "Enter a valid PH mobile number"),
  email: z.string().email("Enter a valid email"),
  referralCode: z.string().optional(),
});
type FormData = z.infer<typeof schema>;



export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s: any) => s.setAuth);

  const [step, setStep] = useState<"register" | "otp">("register");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [confirm, setConfirm] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.register(data);
      const confirmation = await auth().signInWithPhoneNumber("+63" + data.mobile.slice(1));
      setConfirm(confirmation);
      setFormData(data);
      setStep("otp");
      setCountdown(60);
      Toast.show({ type: "success", text1: "OTP sent!" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || "Registration failed" });
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6 || !confirm || !formData) return;
    setLoading(true);
    try {
      const credential = await confirm.confirm(otp);
      const firebaseToken = await credential!.user.getIdToken();
      const res = await authApi.verifyRegisterOtp(formData.mobile, firebaseToken);
      const { accessToken, refreshToken, user } = res.data;
      await setAuth(user, accessToken, refreshToken);
      Toast.show({ type: "success", text1: "Account verified! Set your MPIN." });
      router.replace("/(auth)/set-mpin");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || "Invalid OTP" });
      setOtp("");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0 || !formData) return;
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber("+63" + formData.mobile.slice(1));
      setConfirm(confirmation);
      setCountdown(60);
      setOtp("");
      Toast.show({ type: "success", text1: "OTP resent!" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.message || "Failed to resend" });
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top nav */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step === "register" && styles.stepDotActive]} />
            <View style={[styles.stepLine]} />
            <View style={[styles.stepDot, step === "otp" && styles.stepDotActive]} />
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>₱</Text>
          </View>
          <Text style={styles.appName}>CashIn Tap</Text>
          <Text style={styles.tagline}>
            {step === "register" ? "Create your account" : "Verify your mobile"}
          </Text>
        </View>

        {/* Register Form */}
        {step === "register" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Info</Text>
            <Text style={styles.cardSub}>Fill in your details to get started</Text>
            <View style={styles.row}>
              <Controller control={control} name="firstName" render={({ field: { onChange, value } }) => (
                <Input
                  label="First Name"
                  placeholder="Juan"
                  value={value}
                  onChangeText={onChange}
                  error={errors.firstName?.message}
                  containerStyle={{ flex: 1, marginRight: SPACING.sm }}
                />
              )} />
              <Controller control={control} name="lastName" render={({ field: { onChange, value } }) => (
                <Input
                  label="Last Name"
                  placeholder="Dela Cruz"
                  value={value}
                  onChangeText={onChange}
                  error={errors.lastName?.message}
                  containerStyle={{ flex: 1 }}
                />
              )} />
            </View>
            <Controller control={control} name="mobile" render={({ field: { onChange, value } }) => (
              <Input
                label="Mobile Number"
                placeholder="09XXXXXXXXX"
                keyboardType="phone-pad"
                value={value}
                onChangeText={onChange}
                leftIcon="phone-portrait-outline"
                error={errors.mobile?.message}
              />
            )} />
            <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
              <Input
                label="Email Address"
                placeholder="juan@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                leftIcon="mail-outline"
                error={errors.email?.message}
              />
            )} />
            <Controller control={control} name="referralCode" render={({ field: { onChange, value } }) => (
              <Input
                label="Referral Code (Optional)"
                placeholder="Enter code"
                autoCapitalize="characters"
                value={value}
                onChangeText={onChange}
                leftIcon="gift-outline"
              />
            )} />
            <Text style={styles.terms}>
              By signing up, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
            <Button title="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} size="lg" />
          </View>
        )}

        {/* OTP Step */}
        {step === "otp" && (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => { setStep("register"); setOtp(""); }} style={styles.backRow}>
              <Ionicons name="chevron-back" size={16} color={COLORS.primary} />
              <Text style={styles.backRowText}>Change number</Text>
            </TouchableOpacity>
            <Text style={styles.cardTitle}>Verify Mobile</Text>
            <Text style={styles.cardSub}>
              OTP sent to <Text style={styles.highlight}>{formData?.mobile}</Text>
            </Text>
            <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyOtp} />
            <Button
              title="Verify & Continue"
              onPress={handleVerifyOtp}
              loading={loading}
              disabled={otp.length < 6}
              size="lg"
            />
            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Resend in <Text style={styles.highlight}>{countdown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color={COLORS.primary} size="small" />
                    : <Text style={styles.linkText}>Resend OTP</Text>}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  topNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.lg },
  backBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  stepIndicator: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  stepDotActive: { backgroundColor: COLORS.primary, width: 20, borderRadius: 4 },
  stepLine: { width: 24, height: 1, backgroundColor: COLORS.border },
  brand: { alignItems: "center", marginBottom: SPACING.xl },
  logoWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 10,
  },
  logoText: { fontSize: 28, color: COLORS.white, fontWeight: "800" },
  appName: { fontSize: FONT_SIZE.xxl, fontWeight: "800", color: COLORS.text, letterSpacing: -0.5 },
  tagline: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 6 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.xs,
  },
  cardTitle: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.text, letterSpacing: -0.3 },
  cardSub: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  row: { flexDirection: "row" },
  terms: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: "center", lineHeight: 18, marginBottom: SPACING.sm },
  termsLink: { color: COLORS.primary, fontWeight: "600" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: SPACING.sm },
  backRowText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: "600" },
  resendRow: { alignItems: "center", marginTop: SPACING.md },
  countdownText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  highlight: { color: COLORS.primary, fontWeight: "700" },
  linkText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: "700" },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.lg },
  loginText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  devBanner: {
    backgroundColor: "rgba(255,176,32,0.15)",
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: "rgba(255,176,32,0.3)",
  },
  devBannerText: { fontSize: FONT_SIZE.xs, color: COLORS.warning, fontWeight: "600", textAlign: "center" },
});

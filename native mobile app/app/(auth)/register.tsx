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
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { authApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS } from "@/utils/theme";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  mobile: z.string().regex(/^09\d{9}$/, "Enter a valid PH mobile number (09XXXXXXXXX)"),
  email: z.string().email("Enter a valid email"),
  referralCode: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<TextInput[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");
  const handleChange = (val: string, idx: number) => {
    const d = val.replace(/\D/g, "").slice(-1);
    onChange(digits.map((c, i) => (i === idx ? d : c)).join("").trimEnd());
    if (d && idx < 5) inputs.current[idx + 1]?.focus();
  };
  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[idx] && idx > 0)
      inputs.current[idx - 1]?.focus();
  };
  return (
    <View style={otpStyles.row}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <TextInput
          key={idx}
          ref={(r) => { if (r) inputs.current[idx] = r; }}
          style={[otpStyles.box, digits[idx] ? otpStyles.boxFilled : {}]}
          value={digits[idx]}
          onChangeText={(v) => handleChange(v, idx)}
          onKeyPress={(e) => handleKeyPress(e, idx)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          autoFocus={idx === 0}
        />
      ))}
    </View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s: any) => s.setAuth);

  const [step, setStep] = useState<"register" | "otp">("register");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.register(data);
      const phoneNumber = "+63" + data.mobile.slice(1);
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirm(confirmation);
      setFormData(data);
      setStep("otp");
      setCountdown(60);
      Toast.show({ type: "success", text1: "OTP sent to your mobile!" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || err?.message || "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6 || !confirm || !formData) return;
    setLoading(true);
    try {
      const credential = await confirm.confirm(otp);
      const firebaseToken = await credential!.user.getIdToken();
      const res = await authApi.verifyRegisterOtp(formData.mobile, firebaseToken);
      const { accessToken, refreshToken, user } = res.data;
      await auth().signOut();
      await setAuth(user, accessToken, refreshToken);
      Toast.show({ type: "success", text1: "Mobile verified! Set your MPIN." });
      router.replace("/(auth)/set-mpin");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || err?.message || "Invalid OTP" });
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !formData) return;
    setLoading(true);
    try {
      const phoneNumber = "+63" + formData.mobile.slice(1);
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirm(confirmation);
      setCountdown(60);
      setOtp("");
      Toast.show({ type: "success", text1: "OTP resent!" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.message || "Failed to resend OTP" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>₱</Text>
          </View>
          <Text style={styles.appName}>CashIn Tap</Text>
          <Text style={styles.tagline}>{step === "register" ? "Create your account" : "Verify your mobile"}</Text>
        </View>

        <View style={styles.card}>
          {step === "register" && (
            <View>
              <View style={styles.row}>
                <Controller control={control} name="firstName" render={({ field: { onChange, value } }) => (
                  <Input label="First Name" placeholder="Juan" value={value} onChangeText={onChange} error={errors.firstName?.message} containerStyle={{ flex: 1, marginRight: SPACING.sm }} />
                )} />
                <Controller control={control} name="lastName" render={({ field: { onChange, value } }) => (
                  <Input label="Last Name" placeholder="Dela Cruz" value={value} onChangeText={onChange} error={errors.lastName?.message} containerStyle={{ flex: 1 }} />
                )} />
              </View>
              <Controller control={control} name="mobile" render={({ field: { onChange, value } }) => (
                <Input label="Mobile Number" placeholder="09XXXXXXXXX" keyboardType="phone-pad" value={value} onChangeText={onChange} leftIcon="phone-portrait-outline" error={errors.mobile?.message} />
              )} />
              <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
                <Input label="Email Address" placeholder="juan@email.com" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} leftIcon="mail-outline" error={errors.email?.message} />
              )} />
              <Controller control={control} name="referralCode" render={({ field: { onChange, value } }) => (
                <Input label="Referral Code (Optional)" placeholder="Enter referral code" autoCapitalize="characters" value={value} onChangeText={onChange} leftIcon="gift-outline" />
              )} />
              <Text style={styles.terms}>
                By signing up, you agree to our <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>.
              </Text>
              <Button title="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} size="lg" />
            </View>
          )}

          {step === "otp" && (
            <View style={styles.otpStep}>
              <Text style={styles.otpLabel}>A 6-digit OTP was sent to</Text>
              <Text style={styles.otpMobile}>{formData?.mobile}</Text>
              <OtpBoxes value={otp} onChange={setOtp} />
              <Button title="Verify & Continue" onPress={handleVerifyOtp} loading={loading} disabled={otp.length < 6} size="lg" style={styles.btn} />
              <View style={styles.resendRow}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>Resend in {countdown}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={loading}>
                    {loading ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Text style={styles.link}>Resend OTP</Text>}
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => { setStep("register"); setOtp(""); }}>
                  <Text style={styles.linkMuted}>Change number</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const otpStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: SPACING.sm, marginVertical: SPACING.lg },
  box: { width: 46, height: 54, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.surface, textAlign: "center", fontSize: 22, fontWeight: "700", color: COLORS.text },
  boxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
});
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  backBtn: { marginBottom: SPACING.md },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  logoWrap: { alignItems: "center", marginBottom: SPACING.lg },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: SPACING.sm },
  logoText: { fontSize: 28, color: COLORS.white, fontWeight: "800" },
  appName: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  tagline: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  row: { flexDirection: "row" },
  terms: { fontSize: 12, color: COLORS.textSecondary, textAlign: "center", marginBottom: SPACING.md, lineHeight: 18 },
  link: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  otpStep: { gap: SPACING.sm },
  otpLabel: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  otpMobile: { fontSize: 16, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  btn: { marginTop: SPACING.sm },
  resendRow: { flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.sm },
  countdownText: { fontSize: 13, color: COLORS.textMuted },
  linkMuted: { fontSize: 13, color: COLORS.textMuted },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.lg },
  loginText: { fontSize: 14, color: COLORS.textSecondary },
});

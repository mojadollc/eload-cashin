import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { authApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS } from "@/utils/theme";

type Step = "mobile" | "otp" | "mpin";

function PinDots({ value, onChange, length, autoFocus }: {
  value: string; onChange: (v: string) => void; length: number; autoFocus?: boolean;
}) {
  const inputs = useRef<TextInput[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");
  const handleChange = (val: string, idx: number) => {
    const d = val.replace(/\D/g, "").slice(-1);
    onChange(digits.map((c, i) => (i === idx ? d : c)).join("").trimEnd());
    if (d && idx < length - 1) inputs.current[idx + 1]?.focus();
  };
  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[idx] && idx > 0)
      inputs.current[idx - 1]?.focus();
  };
  return (
    <View style={pinStyles.row}>
      {Array.from({ length }).map((_, idx) => (
        <TextInput
          key={idx}
          ref={(r) => { if (r) inputs.current[idx] = r; }}
          style={[pinStyles.box, digits[idx] ? pinStyles.boxFilled : {}]}
          value={digits[idx] ? "●" : ""}
          onChangeText={(v) => handleChange(v, idx)}
          onKeyPress={(e) => handleKeyPress(e, idx)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          autoFocus={autoFocus && idx === 0}
        />
      ))}
    </View>
  );
}

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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s: any) => s.setAuth);

  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mpin, setMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [pendingAuth, setPendingAuth] = useState<{ accessToken: string; refreshToken: string; user: any } | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!mobile.match(/^09\d{9}$/)) {
      Toast.show({ type: "error", text1: "Enter a valid PH mobile number (09XXXXXXXXX)" });
      return;
    }
    setLoading(true);
    try {
      const phoneNumber = "+63" + mobile.slice(1);
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirm(confirmation);
      setStep("otp");
      setCountdown(60);
      Toast.show({ type: "success", text1: "OTP sent to your mobile!" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.message || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6 || !confirm) return;
    setLoading(true);
    try {
      const credential = await confirm.confirm(otp);
      const firebaseToken = await credential!.user.getIdToken();
      const res = await authApi.verifyLoginOtp(mobile, firebaseToken);
      const { accessToken, refreshToken, requiresMpin, user } = res.data;
      await auth().signOut();
      if (requiresMpin) {
        setPendingAuth({ accessToken, refreshToken, user });
        setStep("mpin");
      } else {
        await setAuth(user, accessToken, refreshToken);
        router.replace("/(auth)/set-mpin");
      }
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || err?.message || "Invalid OTP" });
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleMpinUnlock = async () => {
    if (!pendingAuth || mpin.length !== 4) return;
    setLoading(true);
    try {
      await authApi.verifyMpin(mpin, pendingAuth.accessToken);
      await setAuth(pendingAuth.user, pendingAuth.accessToken, pendingAuth.refreshToken);
      router.replace("/(tabs)");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || "Incorrect MPIN" });
      setMpin("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const phoneNumber = "+63" + mobile.slice(1);
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>₱</Text>
          </View>
          <Text style={styles.appName}>CashIn Tap</Text>
          <Text style={styles.tagline}>
            {step === "mobile" && "Sign in to your account"}
            {step === "otp" && "Verify your mobile number"}
            {step === "mpin" && `Welcome back, ${pendingAuth?.user?.firstName}!`}
          </Text>
        </View>

        <View style={styles.card}>
          {step === "mobile" && (
            <View style={styles.stepContent}>
              <Input label="Mobile Number" placeholder="09XXXXXXXXX" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} leftIcon="phone-portrait-outline" />
              <Button title="Send OTP" onPress={handleSendOtp} loading={loading} size="lg" style={styles.btn} />
              <View style={styles.linkRow}>
                <Text style={styles.linkText}>No account? </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                  <Text style={styles.link}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === "otp" && (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>OTP sent to</Text>
              <Text style={styles.stepValue}>{mobile}</Text>
              <OtpBoxes value={otp} onChange={setOtp} />
              <Button title="Verify OTP" onPress={handleVerifyOtp} loading={loading} disabled={otp.length < 6} size="lg" style={styles.btn} />
              <View style={styles.resendRow}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>Resend in {countdown}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={loading}>
                    {loading ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Text style={styles.link}>Resend OTP</Text>}
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => { setStep("mobile"); setOtp(""); }}>
                  <Text style={styles.linkMuted}>Change number</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === "mpin" && (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Enter your 4-digit MPIN to continue</Text>
              <PinDots value={mpin} onChange={setMpin} length={4} autoFocus />
              <Button title="Unlock" onPress={handleMpinUnlock} loading={loading} disabled={mpin.length !== 4} size="lg" style={styles.btn} />
              <TouchableOpacity onPress={() => router.push("/(auth)/forgot-mpin")} style={styles.forgotWrap}>
                <Text style={styles.link}>Forgot MPIN?</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const pinStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: SPACING.sm, marginVertical: SPACING.lg },
  box: { width: 52, height: 60, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.surface, textAlign: "center", fontSize: 24, color: COLORS.text },
  boxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
});
const otpStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: SPACING.sm, marginVertical: SPACING.lg },
  box: { width: 46, height: 54, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.surface, textAlign: "center", fontSize: 22, fontWeight: "700", color: COLORS.text },
  boxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
});
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  logoWrap: { alignItems: "center", marginBottom: SPACING.xl },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: SPACING.sm },
  logoText: { fontSize: 32, color: COLORS.white, fontWeight: "800" },
  appName: { fontSize: 26, fontWeight: "800", color: COLORS.text },
  tagline: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: "center" },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  stepContent: { gap: SPACING.sm },
  stepLabel: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  stepValue: { fontSize: 16, fontWeight: "700", color: COLORS.text, textAlign: "center", marginBottom: SPACING.sm },
  btn: { marginTop: SPACING.sm },
  resendRow: { flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.sm },
  countdownText: { fontSize: 13, color: COLORS.textMuted },
  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.md },
  linkText: { fontSize: 14, color: COLORS.textSecondary },
  link: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  linkMuted: { fontSize: 13, color: COLORS.textMuted },
  forgotWrap: { alignItems: "center", marginTop: SPACING.md },
});

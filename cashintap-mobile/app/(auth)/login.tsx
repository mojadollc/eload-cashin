import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
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

type Step = "mobile" | "otp" | "mpin";

function PinInput({ value, onChange, length = 4, autoFocus }: {
  value: string; onChange: (v: string) => void; length?: number; autoFocus?: boolean;
}) {
  const inputs = useRef<TextInput[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const handleChange = (val: string, idx: number) => {
    const d = val.replace(/\D/g, "").slice(-1);
    onChange(digits.map((c, i) => (i === idx ? d : c)).join("").trimEnd());
    if (d && idx < length - 1) inputs.current[idx + 1]?.focus();
  };
  const handleKey = (e: any, idx: number) => {
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
          onKeyPress={(e) => handleKey(e, idx)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          autoFocus={autoFocus && idx === 0}
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
  const [confirm, setConfirm] = useState<any>(null);
  const [pendingAuth, setPendingAuth] = useState<{ accessToken: string; refreshToken: string; user: any } | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!mobile.match(/^09\d{9}$/)) {
      Toast.show({ type: "error", text1: "Enter a valid PH mobile number (09XXXXXXXXX)" });
      return;
    }
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber("+63" + mobile.slice(1));
      setConfirm(confirmation);
      setStep("otp");
      setCountdown(60);
      Toast.show({ type: "success", text1: "OTP sent!" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.message || "Failed to send OTP" });
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6 || !confirm) return;
    setLoading(true);
    try {
      const credential = await confirm.confirm(otp);
      const firebaseToken = await credential.user.getIdToken();
      const res = await authApi.verifyLoginOtp(mobile, firebaseToken);
      const { accessToken, refreshToken, requiresMpin, user } = res.data;
      if (requiresMpin) {
        setPendingAuth({ accessToken, refreshToken, user });
        setStep("mpin");
      } else {
        await setAuth(user, accessToken, refreshToken);
        router.replace("/(auth)/set-mpin");
      }
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || "Invalid OTP" });
      setOtp("");
    } finally { setLoading(false); }
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
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber("+63" + mobile.slice(1));
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>₱</Text>
          </View>
          <Text style={styles.appName}>CashIn Tap</Text>
          <Text style={styles.tagline}>
            {step === "mobile" && "Welcome back"}
            {step === "otp" && "Verify your number"}
            {step === "mpin" && `Hi, ${pendingAuth?.user?.firstName} 👋`}
          </Text>
        </View>

        {/* Step: Mobile */}
        {step === "mobile" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSub}>Enter your registered mobile number</Text>
            <View style={styles.fieldGroup}>
              <Input
                label="Mobile Number"
                placeholder="09XXXXXXXXX"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
                leftIcon="phone-portrait-outline"
              />
              <Button title="Send OTP" onPress={handleSendOtp} loading={loading} size="lg" />
            </View>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={styles.registerBtn}>
              <Text style={styles.registerBtnText}>Create an account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step: OTP */}
        {step === "otp" && (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => { setStep("mobile"); setOtp(""); }} style={styles.backRow}>
              <Ionicons name="chevron-back" size={16} color={COLORS.primary} />
              <Text style={styles.backRowText}>Change number</Text>
            </TouchableOpacity>
            <Text style={styles.cardTitle}>Enter OTP</Text>
            <Text style={styles.cardSub}>
              Sent to <Text style={styles.highlight}>{mobile}</Text>
            </Text>
            <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyOtp} />
            <Button
              title="Verify"
              onPress={handleVerifyOtp}
              loading={loading}
              disabled={otp.length < 6}
              size="lg"
              style={styles.actionBtn}
            />
            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>Resend code in <Text style={styles.highlight}>{countdown}s</Text></Text>
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

        {/* Step: MPIN */}
        {step === "mpin" && (
          <View style={styles.card}>
            <View style={styles.mpinIconWrap}>
              <Ionicons name="lock-closed" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Enter MPIN</Text>
            <Text style={styles.cardSub}>Use your 4-digit MPIN to unlock</Text>
            <PinInput value={mpin} onChange={setMpin} autoFocus />
            <Button
              title="Unlock"
              onPress={handleMpinUnlock}
              loading={loading}
              disabled={mpin.length !== 4}
              size="lg"
              style={styles.actionBtn}
            />
            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-mpin")} style={styles.forgotRow}>
              <Text style={styles.linkText}>Forgot MPIN?</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const pinStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: SPACING.md, marginVertical: SPACING.lg },
  box: {
    width: 62, height: 70, borderRadius: RADIUS.lg, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.surfaceElevated,
    textAlign: "center", fontSize: 28, color: COLORS.text,
  },
  boxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  brand: { alignItems: "center", marginBottom: SPACING.xl },
  logoWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 12,
  },
  logoText: { fontSize: 34, color: COLORS.white, fontWeight: "800" },
  appName: { fontSize: FONT_SIZE.xxl, fontWeight: "800", color: COLORS.text, letterSpacing: -0.5 },
  tagline: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: 6 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.xs,
  },
  cardTitle: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.text, letterSpacing: -0.3 },
  cardSub: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  fieldGroup: { gap: SPACING.sm, marginTop: SPACING.sm },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md, marginVertical: SPACING.sm },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  registerBtn: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingVertical: 14, alignItems: "center",
  },
  registerBtnText: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.textSecondary },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: SPACING.sm },
  backRowText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: "600" },
  actionBtn: { marginTop: SPACING.xs },
  resendRow: { alignItems: "center", marginTop: SPACING.md },
  countdownText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  highlight: { color: COLORS.primary, fontWeight: "700" },
  linkText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: "700" },
  mpinIconWrap: {
    width: 60, height: 60, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: SPACING.sm,
  },
  forgotRow: { alignItems: "center", marginTop: SPACING.md },
});

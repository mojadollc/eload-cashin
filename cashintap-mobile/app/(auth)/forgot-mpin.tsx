import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import auth from "@/lib/firebase";
import { authApi } from "@/api/endpoints";
import Button from "@/components/Button";
import Input from "@/components/Input";
import OtpInput from "@/components/OtpInput";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";

type Step = "mobile" | "otp" | "reset" | "done";

function PinInput({ value, onChange, autoFocus }: {
  value: string; onChange: (v: string) => void; autoFocus?: boolean;
}) {
  const inputs = useRef<TextInput[]>([]);
  const digits = Array.from({ length: 4 }, (_, i) => value[i] || "");
  const handleChange = (val: string, idx: number) => {
    const d = val.replace(/\D/g, "").slice(-1);
    onChange(digits.map((c, i) => (i === idx ? d : c)).join("").trimEnd());
    if (d && idx < 3) inputs.current[idx + 1]?.focus();
  };
  const handleKey = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[idx] && idx > 0)
      inputs.current[idx - 1]?.focus();
  };
  return (
    <View style={pinStyles.row}>
      {Array.from({ length: 4 }).map((_, idx) => (
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

const STEP_LABELS = ["Mobile", "Verify", "New MPIN"];

export default function ForgotMpinScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verifiedOtp, setVerifiedOtp] = useState("");
  const [confirm, setConfirm] = useState<any>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!mobile.match(/^09\d{9}$/)) { Toast.show({ type: "error", text1: "Enter a valid PH mobile number" }); return; }
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber("+63" + mobile.slice(1));
      setConfirm(confirmation);
      setStep("otp");
      setCountdown(60);
      Toast.show({ type: "success", text1: "OTP sent!" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || "Failed to send OTP" });
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6 || !confirm) return;
    setLoading(true);
    try {
      const credential = await confirm.confirm(otp);
      const token = await credential!.user.getIdToken();
      setVerifiedOtp(token);
      setStep("reset");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.message || "Invalid OTP" });
      setOtp("");
    } finally { setLoading(false); }
  };

  const handleResetMpin = async () => {
    if (newPin.length !== 4) { Toast.show({ type: "error", text1: "Enter a 4-digit MPIN" }); return; }
    if (newPin !== confirmPin) { Toast.show({ type: "error", text1: "MPINs do not match" }); setConfirmPin(""); return; }
    setLoading(true);
    try {
      await authApi.resetMpin(mobile, verifiedOtp, newPin);
      setStep("done");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || "Failed to reset MPIN" });
    } finally { setLoading(false); }
  };

  const stepIndex = step === "mobile" ? 0 : step === "otp" ? 1 : step === "reset" ? 2 : 3;

  if (step === "done") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.doneWrap}>
          <View style={styles.successRing}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={36} color={COLORS.white} />
            </View>
          </View>
          <Text style={styles.doneTitle}>MPIN Reset!</Text>
          <Text style={styles.doneSub}>Your MPIN has been updated. You can now sign in with your new MPIN.</Text>
          <Button title="Back to Sign In" onPress={() => router.replace("/(auth)/login")} size="lg" style={styles.doneBtn} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Reset MPIN</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Step progress */}
        <View style={styles.stepsRow}>
          {STEP_LABELS.map((label, i) => (
            <React.Fragment key={label}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, i <= stepIndex && styles.stepCircleActive]}>
                  {i < stepIndex
                    ? <Ionicons name="checkmark" size={12} color={COLORS.white} />
                    : <Text style={[styles.stepNum, i === stepIndex && styles.stepNumActive]}>{i + 1}</Text>
                  }
                </View>
                <Text style={[styles.stepLabel, i === stepIndex && styles.stepLabelActive]}>{label}</Text>
              </View>
              {i < 2 && <View style={[styles.stepLine, i < stepIndex && styles.stepLineActive]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Mobile step */}
        {step === "mobile" && (
          <View style={styles.card}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="phone-portrait-outline" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Enter Mobile Number</Text>
            <Text style={styles.cardSub}>We'll send an OTP to verify your identity</Text>
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
        )}

        {/* OTP step */}
        {step === "otp" && (
          <View style={styles.card}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Enter OTP</Text>
            <Text style={styles.cardSub}>
              Sent to <Text style={styles.highlight}>{mobile}</Text>
            </Text>
            <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyOtp} />
            <Button title="Verify" onPress={handleVerifyOtp} loading={loading} disabled={otp.length < 6} size="lg" />
            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>Resend in <Text style={styles.highlight}>{countdown}s</Text></Text>
              ) : (
                <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color={COLORS.primary} size="small" />
                    : <Text style={styles.linkText}>Resend OTP</Text>}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Reset step */}
        {step === "reset" && (
          <View style={styles.card}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="keypad-outline" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>New MPIN</Text>
            <Text style={styles.cardSub}>Create a new 4-digit MPIN</Text>
            <Text style={styles.pinLabel}>Enter new MPIN</Text>
            <PinInput value={newPin} onChange={setNewPin} autoFocus />
            <Text style={styles.pinLabel}>Confirm new MPIN</Text>
            <PinInput value={confirmPin} onChange={setConfirmPin} />
            <Button
              title="Reset MPIN"
              onPress={handleResetMpin}
              loading={loading}
              disabled={newPin.length !== 4 || confirmPin.length !== 4}
              size="lg"
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const pinStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: SPACING.md, marginVertical: SPACING.md },
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
  topNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.xl },
  backBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  navTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text },
  stepsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: SPACING.xl },
  stepItem: { alignItems: "center", gap: 6 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.surfaceElevated, borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: { fontSize: FONT_SIZE.xs, fontWeight: "700", color: COLORS.textMuted },
  stepNumActive: { color: COLORS.white },
  stepLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" },
  stepLabelActive: { color: COLORS.primary },
  stepLine: { width: 32, height: 1.5, backgroundColor: COLORS.border, marginBottom: 18, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: COLORS.primary },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.xs,
  },
  cardIconWrap: {
    width: 56, height: 56, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: SPACING.sm,
  },
  cardTitle: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.text, textAlign: "center", letterSpacing: -0.3 },
  cardSub: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: "center", marginBottom: SPACING.sm },
  pinLabel: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textSecondary, textAlign: "center" },
  resendRow: { alignItems: "center", marginTop: SPACING.md },
  countdownText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  highlight: { color: COLORS.primary, fontWeight: "700" },
  linkText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: "700" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING.xl },
  successRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.successLight, alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  successCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center",
  },
  doneTitle: { fontSize: FONT_SIZE.xxxl, fontWeight: "800", color: COLORS.text, letterSpacing: -0.5, marginBottom: SPACING.sm },
  doneSub: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: "center", lineHeight: 24, marginBottom: SPACING.xl },
  doneBtn: { width: "100%" },
});

import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi } from "@/api/endpoints";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS } from "@/utils/theme";

type Step = "mobile" | "otp" | "reset" | "done";

function PinDots({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const inputs = useRef<TextInput[]>([]);
  const digits = Array.from({ length: 4 }, (_, i) => value[i] || "");
  const handleChange = (val: string, idx: number) => {
    const d = val.replace(/\D/g, "").slice(-1);
    onChange(digits.map((c, i) => (i === idx ? d : c)).join("").trimEnd());
    if (d && idx < 3) inputs.current[idx + 1]?.focus();
  };
  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[idx] && idx > 0)
      inputs.current[idx - 1]?.focus();
  };
  return (
    <View style={styles.pinRow}>
      {Array.from({ length: 4 }).map((_, idx) => (
        <TextInput
          key={idx}
          ref={(r) => { if (r) inputs.current[idx] = r; }}
          style={[styles.pinBox, digits[idx] ? styles.pinBoxFilled : {}]}
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

export default function ForgotMpinScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!mobile.match(/^09\d{9}$/)) {
      Toast.show({ type: "error", text1: "Enter a valid PH mobile number" });
      return;
    }
    setLoading(true);
    try {
      await authApi.sendResetMpinOtp(mobile);
      setStep("otp");
      setCountdown(60);
      Toast.show({ type: "success", text1: "OTP sent!" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    // Just move to reset step — OTP will be verified together with new PIN
    setStep("reset");
  };

  const handleResetMpin = async () => {
    if (newPin.length !== 4) { Toast.show({ type: "error", text1: "Enter a 4-digit MPIN" }); return; }
    if (newPin !== confirmPin) { Toast.show({ type: "error", text1: "MPINs do not match" }); setConfirmPin(""); return; }
    setLoading(true);
    try {
      await authApi.resetMpin(mobile, otp, newPin);
      setStep("done");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || "Failed to reset MPIN" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await authApi.sendResetMpinOtp(mobile);
      setCountdown(60);
      setOtp("");
      Toast.show({ type: "success", text1: "OTP resent!" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || "Failed to resend OTP" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + SPACING.lg }]}>
        {step !== "done" && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}

        {step === "mobile" && (
          <View style={styles.content}>
            <Text style={styles.icon}>🔑</Text>
            <Text style={styles.heading}>Forgot MPIN?</Text>
            <Text style={styles.subheading}>Enter your registered mobile number to reset your MPIN via OTP.</Text>
            <Input label="Mobile Number" placeholder="09XXXXXXXXX" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} leftIcon="phone-portrait-outline" />
            <Button title="Send OTP" onPress={handleSendOtp} loading={loading} size="lg" />
          </View>
        )}

        {step === "otp" && (
          <View style={styles.content}>
            <Text style={styles.icon}>📱</Text>
            <Text style={styles.heading}>Verify Mobile</Text>
            <Text style={styles.subheading}>OTP sent to <Text style={styles.bold}>{mobile}</Text></Text>
            <OtpBoxes value={otp} onChange={setOtp} />
            <Button title="Next" onPress={handleVerifyOtp} disabled={otp.length < 6} size="lg" style={styles.btn} />
            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>Resend in {countdown}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={loading}>
                  {loading ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Text style={styles.link}>Resend OTP</Text>}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {step === "reset" && (
          <View style={styles.content}>
            <Text style={styles.icon}>🔐</Text>
            <Text style={styles.heading}>New MPIN</Text>
            <Text style={styles.subheading}>Create a new 4-digit MPIN</Text>
            <Text style={styles.pinLabel}>Enter new MPIN</Text>
            <PinDots value={newPin} onChange={setNewPin} autoFocus />
            <Text style={styles.pinLabel}>Confirm new MPIN</Text>
            <PinDots value={confirmPin} onChange={setConfirmPin} />
            <Button title="Reset MPIN" onPress={handleResetMpin} loading={loading} disabled={newPin.length !== 4 || confirmPin.length !== 4} size="lg" style={styles.btn} />
          </View>
        )}

        {step === "done" && (
          <View style={styles.doneContent}>
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.heading}>MPIN Reset!</Text>
            <Text style={styles.subheading}>Your MPIN has been reset. You can now sign in with your new MPIN.</Text>
            <Button title="Go to Login" onPress={() => router.replace("/(auth)/login")} size="lg" style={styles.btn} />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const otpStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: SPACING.sm, marginVertical: SPACING.lg },
  box: { width: 46, height: 54, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.surface, textAlign: "center", fontSize: 22, fontWeight: "700", color: COLORS.text },
  boxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
});
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.lg },
  backBtn: { marginBottom: SPACING.lg },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  content: { flex: 1 },
  doneContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 52, textAlign: "center", marginBottom: SPACING.md },
  heading: { fontSize: 24, fontWeight: "800", color: COLORS.text, textAlign: "center", marginBottom: 8 },
  subheading: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: SPACING.xl, lineHeight: 22 },
  bold: { fontWeight: "700", color: COLORS.text },
  pinLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: SPACING.sm },
  pinRow: { flexDirection: "row", justifyContent: "center", gap: SPACING.md, marginBottom: SPACING.lg },
  pinBox: { width: 60, height: 68, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.surface, textAlign: "center", fontSize: 28, color: COLORS.text },
  pinBoxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  btn: { marginTop: SPACING.sm },
  resendRow: { alignItems: "center", marginTop: SPACING.md },
  countdownText: { fontSize: 13, color: COLORS.textMuted },
  link: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E8FFF4", alignItems: "center", justifyContent: "center", marginBottom: SPACING.lg },
  successIcon: { fontSize: 36, color: COLORS.success },
});

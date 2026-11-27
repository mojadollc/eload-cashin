import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/Button";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";

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
    <View style={styles.pinRow}>
      {Array.from({ length: 4 }).map((_, idx) => (
        <TextInput
          key={idx}
          ref={(r) => { if (r) inputs.current[idx] = r; }}
          style={[styles.pinBox, digits[idx] ? styles.pinBoxFilled : {}]}
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

export default function SetMpinScreen() {
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [step, setStep] = useState<"set" | "confirm">("set");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (pin.length !== 4) { Toast.show({ type: "error", text1: "Enter a 4-digit MPIN" }); return; }
    setStep("confirm");
  };

  const handleSetMpin = async () => {
    if (confirmPin !== pin) {
      Toast.show({ type: "error", text1: "MPINs do not match" });
      setConfirmPin("");
      return;
    }
    setLoading(true);
    try {
      await authApi.setMpin(pin, accessToken!);
      updateUser({ hasPin: true });
      Toast.show({ type: "success", text1: "MPIN set successfully!" });
      router.replace("/(tabs)");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.error || "Failed to set MPIN" });
    } finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: step === "set" ? "50%" : "100%" }]} />
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name={step === "set" ? "keypad-outline" : "shield-checkmark-outline"} size={32} color={COLORS.primary} />
        </View>

        <Text style={styles.heading}>
          {step === "set" ? "Create Your MPIN" : "Confirm MPIN"}
        </Text>
        <Text style={styles.subheading}>
          {step === "set"
            ? "Choose a 4-digit MPIN to secure your account"
            : "Re-enter your MPIN to confirm"}
        </Text>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepChip, step === "set" && styles.stepChipActive]}>
            <Text style={[styles.stepChipText, step === "set" && styles.stepChipTextActive]}>1 Enter</Text>
          </View>
          <View style={styles.stepConnector} />
          <View style={[styles.stepChip, step === "confirm" && styles.stepChipActive]}>
            <Text style={[styles.stepChipText, step === "confirm" && styles.stepChipTextActive]}>2 Confirm</Text>
          </View>
        </View>

        {step === "set"
          ? <PinInput value={pin} onChange={setPin} autoFocus />
          : <PinInput value={confirmPin} onChange={setConfirmPin} autoFocus />
        }

        <Button
          title={step === "set" ? "Continue" : "Set MPIN"}
          onPress={step === "set" ? handleNext : handleSetMpin}
          loading={loading}
          disabled={step === "set" ? pin.length !== 4 : confirmPin.length !== 4}
          size="lg"
          style={styles.btn}
        />

        {step === "confirm" && (
          <TouchableOpacity onPress={() => { setStep("set"); setConfirmPin(""); }} style={styles.changeLink}>
            <Ionicons name="chevron-back" size={14} color={COLORS.primary} />
            <Text style={styles.changeLinkText}>Change MPIN</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.note}>
          You'll use this MPIN every time you sign in after OTP verification.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  progressBar: { height: 3, backgroundColor: COLORS.surfaceElevated },
  progressFill: { height: 3, backgroundColor: COLORS.primary, borderRadius: 2 },
  content: { flex: 1, alignItems: "center", paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl },
  iconCircle: {
    width: 72, height: 72, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  heading: { fontSize: FONT_SIZE.xxl, fontWeight: "800", color: COLORS.text, textAlign: "center", letterSpacing: -0.5 },
  subheading: {
    fontSize: FONT_SIZE.sm, color: COLORS.textSecondary,
    textAlign: "center", marginTop: 8, marginBottom: SPACING.lg, lineHeight: 22,
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.sm },
  stepChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1, borderColor: COLORS.border,
  },
  stepChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  stepChipText: { fontSize: FONT_SIZE.xs, fontWeight: "600", color: COLORS.textMuted },
  stepChipTextActive: { color: COLORS.primary },
  stepConnector: { width: 20, height: 1, backgroundColor: COLORS.border },
  pinRow: { flexDirection: "row", justifyContent: "center", gap: SPACING.md, marginVertical: SPACING.xl },
  pinBox: {
    width: 64, height: 72, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
    textAlign: "center", fontSize: 30, color: COLORS.text,
  },
  pinBoxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  btn: { width: "100%" },
  changeLink: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: SPACING.lg },
  changeLinkText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: "600" },
  note: {
    fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: "center",
    marginTop: SPACING.xl, lineHeight: 18, paddingHorizontal: SPACING.md,
  },
});

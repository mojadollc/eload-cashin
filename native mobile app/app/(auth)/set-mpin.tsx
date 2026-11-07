import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/Button";
import { COLORS, SPACING, RADIUS } from "@/utils/theme";

type Step = "set" | "confirm";

function PinDots({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const inputs = useRef<TextInput[]>([]);
  const digits = Array.from({ length: 4 }, (_, i) => value[i] || "");

  const handleChange = (val: string, idx: number) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = digits.map((c, i) => (i === idx ? d : c)).join("").trimEnd();
    onChange(next);
    if (d && idx < 3) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
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

export default function SetMpinScreen() {
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [step, setStep] = useState<Step>("set");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (pin.length !== 4) {
      Toast.show({ type: "error", text1: "Enter a 4-digit MPIN" });
      return;
    }
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.xl }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.heading}>
          {step === "set" ? "Create Your MPIN" : "Confirm Your MPIN"}
        </Text>
        <Text style={styles.subheading}>
          {step === "set"
            ? "Set a 4-digit MPIN to secure your account"
            : "Re-enter your MPIN to confirm"}
        </Text>

        {step === "set" ? (
          <PinDots value={pin} onChange={setPin} autoFocus />
        ) : (
          <PinDots value={confirmPin} onChange={setConfirmPin} autoFocus />
        )}

        <Button
          title={step === "set" ? "Next" : "Set MPIN"}
          onPress={step === "set" ? handleNext : handleSetMpin}
          loading={loading}
          disabled={step === "set" ? pin.length !== 4 : confirmPin.length !== 4}
          size="lg"
          style={styles.btn}
        />

        {step === "confirm" && (
          <TouchableOpacity onPress={() => { setStep("set"); setConfirmPin(""); }} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Change MPIN</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.note}>
          You'll use this 4-digit MPIN every time you log in after OTP verification.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: "center", paddingHorizontal: SPACING.lg },
  icon: { fontSize: 56, marginBottom: SPACING.md },
  heading: { fontSize: 24, fontWeight: "800", color: COLORS.text, textAlign: "center" },
  subheading: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, marginBottom: SPACING.xl, lineHeight: 22 },
  pinRow: { flexDirection: "row", justifyContent: "center", gap: SPACING.md, marginBottom: SPACING.xl },
  pinBox: {
    width: 60,
    height: 68,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    textAlign: "center",
    fontSize: 28,
    color: COLORS.text,
  },
  pinBoxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  btn: { width: "100%" },
  backLink: { marginTop: SPACING.md },
  backLinkText: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  note: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: SPACING.xl, lineHeight: 18, paddingHorizontal: SPACING.md },
});

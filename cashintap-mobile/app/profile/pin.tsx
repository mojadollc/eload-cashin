import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { pinApi } from "@/api/endpoints";
import Header from "@/components/Header";
import Button from "@/components/Button";
import { COLORS, SPACING, RADIUS } from "@/utils/theme";

export default function SetPinScreen() {
  const [step, setStep] = useState<"set" | "confirm">("set");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [firstPin, setFirstPin] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef<TextInput[]>([]);
  const confirmInputs = useRef<TextInput[]>([]);

  const handleChange = (val: string, idx: number, isConfirm: boolean) => {
    const arr = isConfirm ? [...confirmPin] : [...pin];
    arr[idx] = val.replace(/\D/g, "").slice(-1);
    isConfirm ? setConfirmPin(arr) : setPin(arr);
    const refs = isConfirm ? confirmInputs : inputs;
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number, isConfirm: boolean) => {
    const arr = isConfirm ? confirmPin : pin;
    const refs = isConfirm ? confirmInputs : inputs;
    if (e.nativeEvent.key === "Backspace" && !arr[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handleNext = () => {
    const code = pin.join("");
    if (code.length < 6) { Toast.show({ type: "error", text1: "Enter a 6-digit PIN" }); return; }
    setFirstPin(code);
    setStep("confirm");
    setTimeout(() => confirmInputs.current[0]?.focus(), 100);
  };

  const handleSetPin = async () => {
    const code = confirmPin.join("");
    if (code !== firstPin) {
      Toast.show({ type: "error", text1: "PINs do not match" });
      setConfirmPin(["", "", "", "", "", ""]);
      confirmInputs.current[0]?.focus();
      return;
    }
    setLoading(true);
    try {
      await pinApi.set(code);
      Toast.show({ type: "success", text1: "PIN set successfully!" });
      router.back();
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.error || "Failed to set PIN" });
    } finally {
      setLoading(false);
    }
  };

  const renderPinInputs = (arr: string[], isConfirm: boolean) => (
    <View style={styles.pinRow}>
      {arr.map((digit, idx) => (
        <TextInput
          key={idx}
          ref={(r) => { if (r) (isConfirm ? confirmInputs : inputs).current[idx] = r; }}
          style={[styles.pinInput, digit ? styles.pinFilled : {}]}
          value={digit ? "●" : ""}
          onChangeText={(v) => handleChange(v, idx, isConfirm)}
          onKeyPress={(e) => handleKeyPress(e, idx, isConfirm)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Set PIN" />
      <View style={styles.content}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.heading}>{step === "set" ? "Create Your PIN" : "Confirm Your PIN"}</Text>
        <Text style={styles.subheading}>
          {step === "set" ? "Enter a 6-digit PIN for quick access" : "Re-enter your PIN to confirm"}
        </Text>

        {step === "set" ? renderPinInputs(pin, false) : renderPinInputs(confirmPin, true)}

        <Button
          title={step === "set" ? "Next" : "Set PIN"}
          onPress={step === "set" ? handleNext : handleSetPin}
          loading={loading}
          size="lg"
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: "center", paddingTop: SPACING.xxl, paddingHorizontal: SPACING.lg },
  icon: { fontSize: 52, marginBottom: SPACING.md },
  heading: { fontSize: 22, fontWeight: "800", color: COLORS.text, textAlign: "center" },
  subheading: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, marginBottom: SPACING.xl },
  pinRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.xl },
  pinInput: {
    width: 48,
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    textAlign: "center",
    fontSize: 22,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  pinFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  btn: { width: "100%" },
});

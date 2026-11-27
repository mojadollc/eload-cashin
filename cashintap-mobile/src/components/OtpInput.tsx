import React, { useRef, useEffect } from "react";
import { View, TextInput, StyleSheet, Platform, AppState } from "react-native";
import * as Clipboard from "expo-clipboard";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";

interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  onComplete?: (v: string) => void;
}

export default function OtpInput({ value, onChange, length = 6, onComplete }: OtpInputProps) {
  const inputs = useRef<TextInput[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fill = (code: string) => {
    const clean = code.replace(/\D/g, "").slice(0, length);
    if (clean.length === length) {
      onChange(clean);
      inputs.current[length - 1]?.focus();
      onComplete?.(clean);
    }
  };

  // Android: poll clipboard when screen is active
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const startPolling = () => {
      pollingRef.current = setInterval(async () => {
        try {
          const text = await Clipboard.getStringAsync();
          if (text && /^\d{6}$/.test(text.trim())) {
            fill(text.trim());
            stopPolling();
          }
        } catch {}
      }, 1000);
    };

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    startPolling();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") startPolling();
      else stopPolling();
    });

    return () => {
      stopPolling();
      sub.remove();
    };
  }, [length]);

  // Stop polling once filled
  useEffect(() => {
    if (value.length === length && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [value, length]);

  const handleChange = (val: string, idx: number) => {
    // Handle paste of full code into any box
    const clean = val.replace(/\D/g, "");
    if (clean.length > 1) {
      fill(clean);
      return;
    }
    const d = clean.slice(-1);
    const next = digits.map((c, i) => (i === idx ? d : c)).join("").trimEnd();
    onChange(next);
    if (d && idx < length - 1) inputs.current[idx + 1]?.focus();
    if (d && idx === length - 1) {
      const complete = next;
      if (complete.length === length) onComplete?.(complete);
    }
  };

  const handleKey = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[idx] && idx > 0)
      inputs.current[idx - 1]?.focus();
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, idx) => (
        <TextInput
          key={idx}
          ref={(r) => { if (r) inputs.current[idx] = r; }}
          style={[styles.box, digits[idx] ? styles.boxFilled : {}]}
          value={digits[idx]}
          onChangeText={(v) => handleChange(v, idx)}
          onKeyPress={(e) => handleKey(e, idx)}
          keyboardType="number-pad"
          maxLength={2} // allow paste detection (>1 char triggers fill)
          selectTextOnFocus
          autoFocus={idx === 0}
          // iOS SMS auto-fill
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
    marginVertical: SPACING.lg,
  },
  box: {
    width: 46,
    height: 54,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
    textAlign: "center",
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  boxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
});

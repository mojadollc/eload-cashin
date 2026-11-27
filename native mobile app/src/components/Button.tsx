import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { COLORS, RADIUS, SPACING, SHADOW } from "@/utils/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        variant === "primary" && !isDisabled && SHADOW.glow,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.accent },
  outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: COLORS.primary },
  danger: { backgroundColor: COLORS.danger },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.4 },
  size_sm: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, minHeight: 36 },
  size_md: { paddingVertical: SPACING.sm + 4, paddingHorizontal: SPACING.lg, minHeight: 48 },
  size_lg: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, minHeight: 56 },
  text: { fontWeight: "700", letterSpacing: 0.3 },
  text_primary: { color: COLORS.white },
  text_secondary: { color: COLORS.background },
  text_outline: { color: COLORS.primary },
  text_danger: { color: COLORS.white },
  text_ghost: { color: COLORS.primary },
  textSize_sm: { fontSize: 13 },
  textSize_md: { fontSize: 15 },
  textSize_lg: { fontSize: 17 },
});

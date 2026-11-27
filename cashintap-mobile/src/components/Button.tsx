import React from "react";
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, View,
} from "react-native";
import { COLORS, RADIUS, SPACING, SHADOW, FONT_SIZE } from "@/utils/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title, onPress, variant = "primary", size = "md",
  loading = false, disabled = false, style, textStyle, icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}` as keyof typeof styles],
        isDisabled && styles.disabled,
        variant === "primary" && !isDisabled && SHADOW.glow,
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.text, styles[`text_${variant}` as keyof typeof styles], styles[`textSize_${size}` as keyof typeof styles], textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  iconWrap: { marginRight: SPACING.sm },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.accent },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  danger: { backgroundColor: COLORS.danger },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.38 },
  size_sm: { paddingVertical: 10, paddingHorizontal: SPACING.md, minHeight: 38 },
  size_md: { paddingVertical: 13, paddingHorizontal: SPACING.lg, minHeight: 50 },
  size_lg: { paddingVertical: 16, paddingHorizontal: SPACING.xl, minHeight: 56 },
  text: { fontWeight: "700", letterSpacing: 0.2 },
  text_primary: { color: COLORS.white },
  text_secondary: { color: COLORS.background },
  text_outline: { color: COLORS.primary },
  text_danger: { color: COLORS.white },
  text_ghost: { color: COLORS.primary },
  textSize_sm: { fontSize: FONT_SIZE.sm },
  textSize_md: { fontSize: FONT_SIZE.md },
  textSize_lg: { fontSize: FONT_SIZE.lg },
});

import React, { useState } from "react";
import {
  View, TextInput, Text, TouchableOpacity,
  StyleSheet, TextInputProps, ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, FONT_SIZE } from "@/utils/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export default function Input({
  label, error, hint, leftIcon, rightIcon, onRightIconPress,
  containerStyle, secureTextEntry, style, ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = secureTextEntry;
  const hasError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, hasError && styles.labelError, focused && styles.labelFocused]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputWrapper,
        hasError ? styles.inputError : focused ? styles.inputFocused : styles.inputNormal,
      ]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={17}
            color={hasError ? COLORS.danger : focused ? COLORS.primary : COLORS.textMuted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeft, style]}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.rightIcon}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color={COLORS.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 7,
    letterSpacing: 0.1,
  },
  labelFocused: { color: COLORS.primary },
  labelError: { color: COLORS.danger },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    backgroundColor: COLORS.surfaceElevated,
    minHeight: 52,
  },
  inputNormal: { borderColor: COLORS.border },
  inputFocused: { borderColor: COLORS.borderFocus, backgroundColor: COLORS.surfaceHighlight },
  inputError: { borderColor: COLORS.danger },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  inputWithLeft: { paddingLeft: SPACING.xs },
  leftIcon: { marginLeft: SPACING.md },
  rightIcon: { paddingHorizontal: SPACING.md },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  error: { fontSize: FONT_SIZE.xs, color: COLORS.danger },
  hint: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 5 },
});

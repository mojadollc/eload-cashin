import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void };
  transparent?: boolean;
}

export default function Header({ title, showBack = true, rightAction, transparent }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }, transparent && styles.transparent]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View style={styles.backBtn}>
              <Ionicons name="chevron-back" size={19} color={COLORS.text} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {rightAction ? (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View style={styles.backBtn}>
              <Ionicons name={rightAction.icon} size={19} color={COLORS.text} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transparent: { backgroundColor: "transparent", borderBottomWidth: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.2,
  },
});

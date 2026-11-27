import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { eloadApi } from "@/api/endpoints";
import { useWallet } from "@/hooks/useWallet";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS, FONT_SIZE } from "@/utils/theme";
import { formatCurrency } from "@/utils/helpers";

const NETWORK_COLORS: Record<string, string> = {
  GLOBE: "#0066FF", SMART: "#00A651", DITO: "#FF6B00",
  TM: "#0066FF", TNT: "#E60026", SUN: "#FFB800", GOMO: "#7B2FBE",
};

export default function EloadScreen() {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: wallet } = useWallet();
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["eload-products"],
    queryFn: () => eloadApi.getProducts().then((r) => r.data.data),
  });

  const networks = productsData?.grouped
    ? [...new Set(Object.values(productsData.grouped).flatMap((cat: any) => Object.keys(cat)))] as string[]
    : [];

  const networkProducts = selectedNetwork && productsData?.grouped
    ? Object.values(productsData.grouped).flatMap((cat: any) => cat[selectedNetwork] || [])
    : [];

  const handlePurchase = () => {
    if (!mobileNumber.match(/^09\d{9}$/)) {
      Toast.show({ type: "error", text1: "Enter a valid PH mobile number" }); return;
    }
    if (!selectedProduct) {
      Toast.show({ type: "error", text1: "Select a load product" }); return;
    }
    if (selectedProduct.amount > parseFloat(wallet?.availableBalance || "0")) {
      Toast.show({ type: "error", text1: "Insufficient balance" }); return;
    }
    Alert.alert(
      "Confirm E-Load",
      `Send ${selectedProduct.name}\n${formatCurrency(selectedProduct.amount)} → ${mobileNumber}`,
      [{ text: "Cancel", style: "cancel" }, { text: "Confirm", onPress: doPurchase }]
    );
  };

  const doPurchase = async () => {
    setLoading(true);
    try {
      await eloadApi.purchase({
        mobileNumber,
        productCode: selectedProduct.productCode,
        network: selectedProduct.network,
        loadAmount: parseFloat(selectedProduct.amount),
        promoId: selectedProduct.promoId,
      });
      Toast.show({ type: "success", text1: "E-Load sent!" });
      router.push("/(tabs)/transactions");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.error || "E-Load failed" });
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Header title="Buy E-Load" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Balance */}
        <View style={styles.balanceRow}>
          <Ionicons name="wallet-outline" size={15} color={COLORS.accent} />
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(wallet?.availableBalance || "0")}</Text>
        </View>

        {/* Mobile Input */}
        <View style={styles.card}>
          <Input
            label="Mobile Number to Load"
            placeholder="09XXXXXXXXX"
            keyboardType="phone-pad"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            leftIcon="phone-portrait-outline"
          />
        </View>

        {/* Networks */}
        <Text style={styles.sectionLabel}>Select Network</Text>
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.networksScroll} contentContainerStyle={styles.networksContent}>
            {networks.map((network) => {
              const color = NETWORK_COLORS[network] || COLORS.primary;
              const active = selectedNetwork === network;
              return (
                <TouchableOpacity
                  key={network}
                  style={[styles.networkChip, active && { borderColor: color, backgroundColor: color + "18" }]}
                  onPress={() => { setSelectedNetwork(network); setSelectedProduct(null); }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.networkDot, { backgroundColor: color }]} />
                  <Text style={[styles.networkText, active && { color }]}>{network}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Products */}
        {selectedNetwork && (
          <>
            <Text style={styles.sectionLabel}>Select Load</Text>
            <View style={styles.productsGrid}>
              {networkProducts.map((product: any) => {
                const active = selectedProduct?.id === product.id;
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.productCard, active && styles.productCardActive]}
                    onPress={() => setSelectedProduct(product)}
                    activeOpacity={0.7}
                  >
                    {active && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                      </View>
                    )}
                    <Text style={[styles.productAmount, active && styles.productAmountActive]}>
                      {formatCurrency(product.amount)}
                    </Text>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    {product.validity && (
                      <View style={styles.validityBadge}>
                        <Text style={styles.validityText}>{product.validity}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Summary */}
        {selectedProduct && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Product</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{selectedProduct.name}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={[styles.summaryValue, styles.summaryAmount]}>{formatCurrency(selectedProduct.amount)}</Text>
            </View>
          </View>
        )}

        <Button
          title="Buy Load"
          onPress={handlePurchase}
          loading={loading}
          disabled={!selectedProduct || !mobileNumber}
          size="lg"
          style={styles.btn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  balanceRow: {
    flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    backgroundColor: COLORS.accentLight, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.accent + "25",
  },
  balanceLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, flex: 1 },
  balanceAmount: { fontSize: FONT_SIZE.lg, fontWeight: "800", color: COLORS.accent },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs, fontWeight: "700", color: COLORS.textMuted,
    marginBottom: SPACING.sm, textTransform: "uppercase", letterSpacing: 1,
  },
  networksScroll: { marginBottom: SPACING.lg },
  networksContent: { gap: SPACING.sm, paddingRight: SPACING.sm },
  networkChip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  networkDot: { width: 8, height: 8, borderRadius: 4 },
  networkText: { fontSize: FONT_SIZE.sm, fontWeight: "700", color: COLORS.textSecondary },
  productsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg },
  productCard: {
    width: "47.5%", backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1.5, borderColor: COLORS.border, position: "relative",
  },
  productCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  checkBadge: { position: "absolute", top: 8, right: 8 },
  productAmount: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.text },
  productAmountActive: { color: COLORS.primary },
  productName: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 3, lineHeight: 16 },
  validityBadge: {
    backgroundColor: COLORS.surfaceHighlight, borderRadius: RADIUS.full,
    paddingHorizontal: 7, paddingVertical: 2, marginTop: 6, alignSelf: "flex-start",
  },
  validityText: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" },
  summaryCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  summaryLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text, flex: 1, textAlign: "right" },
  summaryAmount: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.primary },
  btn: { marginTop: SPACING.xs },
});

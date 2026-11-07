import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { eloadApi, walletApi } from "@/api/endpoints";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLORS, SPACING, RADIUS, SHADOW } from "@/utils/theme";
import { formatCurrency } from "@/utils/helpers";

const NETWORK_COLORS: Record<string, string> = {
  GLOBE: "#0066FF",
  SMART: "#00A651",
  DITO: "#FF6B00",
  TM: "#0066FF",
  TNT: "#FF0000",
  SUN: "#FFB800",
  GOMO: "#7B2FBE",
};

export default function EloadScreen() {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["eload-products"],
    queryFn: () => eloadApi.getProducts().then((r) => r.data.data),
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletApi.getWallet().then((r) => r.data.data),
  });

  const networks = productsData?.grouped
    ? Object.values(productsData.grouped).flatMap((cat: any) => Object.keys(cat))
    : [];
  const uniqueNetworks = [...new Set(networks)] as string[];

  const networkProducts = selectedNetwork && productsData?.grouped
    ? Object.values(productsData.grouped).flatMap((cat: any) => cat[selectedNetwork] || [])
    : [];

  const handlePurchase = () => {
    if (!mobileNumber.match(/^09\d{9}$/)) {
      Toast.show({ type: "error", text1: "Enter a valid PH mobile number" });
      return;
    }
    if (!selectedProduct) {
      Toast.show({ type: "error", text1: "Select a load product" });
      return;
    }
    const balance = parseFloat(wallet?.availableBalance || "0");
    if (selectedProduct.amount > balance) {
      Toast.show({ type: "error", text1: "Insufficient balance" });
      return;
    }

    Alert.alert(
      "Confirm E-Load",
      `Send ${selectedProduct.name} (${formatCurrency(selectedProduct.amount)}) to ${mobileNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: doPurchase },
      ]
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
      Toast.show({ type: "success", text1: "E-Load sent successfully!" });
      router.push("/(tabs)/transactions");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.error || "E-Load failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Buy E-Load" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Balance */}
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Balance:</Text>
          <Text style={styles.balance}>{formatCurrency(wallet?.availableBalance || "0")}</Text>
        </View>

        {/* Mobile Number */}
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
        <Text style={styles.sectionTitle}>Select Network</Text>
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.networksScroll}>
            {uniqueNetworks.map((network) => (
              <TouchableOpacity
                key={network}
                style={[
                  styles.networkBtn,
                  selectedNetwork === network && { borderColor: NETWORK_COLORS[network] || COLORS.primary, backgroundColor: (NETWORK_COLORS[network] || COLORS.primary) + "15" },
                ]}
                onPress={() => { setSelectedNetwork(network); setSelectedProduct(null); }}
              >
                <View style={[styles.networkDot, { backgroundColor: NETWORK_COLORS[network] || COLORS.primary }]} />
                <Text style={[styles.networkText, selectedNetwork === network && { color: NETWORK_COLORS[network] || COLORS.primary }]}>
                  {network}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Products */}
        {selectedNetwork && (
          <>
            <Text style={styles.sectionTitle}>Select Load</Text>
            <View style={styles.productsGrid}>
              {networkProducts.map((product: any) => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.productCard,
                    selectedProduct?.id === product.id && styles.productCardActive,
                  ]}
                  onPress={() => setSelectedProduct(product)}
                >
                  <Text style={[styles.productAmount, selectedProduct?.id === product.id && styles.productAmountActive]}>
                    {formatCurrency(product.amount)}
                  </Text>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  {product.validity && (
                    <Text style={styles.productValidity}>{product.validity}</Text>
                  )}
                  {selectedProduct?.id === product.id && (
                    <View style={styles.checkMark}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Selected Summary */}
        {selectedProduct && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Selected Load</Text>
            <Text style={styles.summaryProduct}>{selectedProduct.name}</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(selectedProduct.amount)}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  balanceLabel: { fontSize: 14, color: COLORS.textSecondary },
  balance: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW.sm, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.sm },
  networksScroll: { marginBottom: SPACING.lg },
  networkBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    gap: SPACING.xs,
  },
  networkDot: { width: 8, height: 8, borderRadius: 4 },
  networkText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  productsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg },
  productCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
    position: "relative",
  },
  productCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  productAmount: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  productAmountActive: { color: COLORS.primary },
  productName: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  productValidity: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  checkMark: { position: "absolute", top: 8, right: 8 },
  summaryCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: "center",
  },
  summaryTitle: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  summaryProduct: { fontSize: 14, fontWeight: "600", color: COLORS.text, textAlign: "center" },
  summaryAmount: { fontSize: 24, fontWeight: "800", color: COLORS.primary, marginTop: 4 },
  btn: { marginTop: SPACING.sm },
});

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { refreshSkuCache } = await import("@/providers/gbits/gbits.provider");
    try {
      const result = await refreshSkuCache();
      console.log(`[startup] GBits SKUs loaded: ${result.count} active SKUs`);
    } catch (err: any) {
      console.error("[startup] GBits SKU preload failed:", err.message);
    }
  }
}

import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/api/endpoints";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletApi.getWallet().then((r) => r.data.data),
    staleTime: 30_000,
  });
}

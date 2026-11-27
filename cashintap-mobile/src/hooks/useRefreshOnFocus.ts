import { useCallback } from "react";
import { useFocusEffect } from "expo-router";

export function useRefreshOnFocus(refetch: () => void) {
  const firstTimeRef = { current: true };

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
}

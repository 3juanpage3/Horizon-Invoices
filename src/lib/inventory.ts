import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listInventory, saveInventoryItems } from "@/lib/api/inventory.functions";

export type InventoryItem = {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
};

export function useInventory() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory"],
    queryFn: () => listInventory(),
  });

  const mutation = useMutation({
    mutationFn: (items: InventoryItem[]) => saveInventoryItems({ data: { items } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const items = query.data ?? [];

  const setItems = (next: InventoryItem[] | ((prev: InventoryItem[]) => InventoryItem[])) => {
    const resolved = typeof next === "function" ? next(items) : next;
    mutation.mutate(resolved);
  };

  return {
    items,
    setItems,
    loaded: query.isFetched,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
  };
}

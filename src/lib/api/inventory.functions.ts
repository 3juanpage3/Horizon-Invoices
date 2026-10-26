import type { InventoryItem } from "../inventory";
import { apiRequest } from "./client";

export const listInventory = () => apiRequest<InventoryItem[]>("/api/inventory");

export const saveInventoryItems = ({ data }: { data: { items: InventoryItem[] } }) =>
  apiRequest<{ success: boolean }>("/api/inventory", {
    method: "PUT",
    body: JSON.stringify(data),
  });

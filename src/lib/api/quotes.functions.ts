import type { SavedQuote } from "../quotes";
import { apiRequest } from "./client";

export const listQuotes = () => apiRequest<SavedQuote[]>("/api/quotes");

export const saveQuote = ({ data }: { data: SavedQuote }) =>
  apiRequest<{ success: boolean }>("/api/quotes", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteQuote = ({ data }: { data: { id: string } }) =>
  apiRequest<{ success: boolean }>("/api/quotes", {
    method: "DELETE",
    body: JSON.stringify(data),
  });

import type { SavedInvoice } from "../invoices";
import { apiRequest } from "./client";

export const listInvoices = () => apiRequest<SavedInvoice[]>("/api/invoices");

export const saveInvoice = ({ data }: { data: SavedInvoice }) =>
  apiRequest<{ success: boolean }>("/api/invoices", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteInvoice = ({ data }: { data: { id: string } }) =>
  apiRequest<{ success: boolean }>("/api/invoices", {
    method: "DELETE",
    body: JSON.stringify(data),
  });

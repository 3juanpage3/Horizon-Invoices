import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteInvoice as deleteInvoiceFn, listInvoices, saveInvoice } from "@/lib/api/invoices.functions";

export type InvoiceLineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
};

export type SavedInvoice = {
  id: string;
  invoiceNo: string;
  date: string;
  email: string;
  cell: string;
  billToName: string;
  billToPhone: string;
  billToAddress: string;
  items: InvoiceLineItem[];
  terms: string;
  total: number;
  savedAt: string;
};

export function useInvoiceHistory() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["invoices"],
    queryFn: () => listInvoices(),
  });

  const saveMutation = useMutation({
    mutationFn: (invoice: SavedInvoice) => saveInvoice({ data: invoice }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvoiceFn({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  return {
    invoices: query.data ?? [],
    saveInvoice: (invoice: SavedInvoice) => saveMutation.mutate(invoice),
    deleteInvoice: (id: string) => deleteMutation.mutate(id),
    loaded: query.isFetched,
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
  };
}

export function searchInvoices(invoices: SavedInvoice[], query: string): SavedInvoice[] {
  const q = query.trim().toLowerCase();
  if (!q) return invoices;

  return invoices.filter((inv) => {
    const haystack = [
      inv.invoiceNo,
      inv.date,
      inv.billToName,
      inv.billToPhone,
      inv.billToAddress,
      inv.email,
      inv.cell,
      inv.total.toFixed(2),
      ...inv.items.map((item) => item.description),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function formatDisplayDate(isoDate: string | null | undefined) {
  // 1. Force catch the exact string you are seeing on the screen
  if (!isoDate || isoDate.trim() === "" || isoDate === "undefined-undefined-Date") {
    return "Date";
  }

  const parts = isoDate.split("-");
  if (parts.length !== 3) return "Date";

  const [y, m, d] = parts;
  if (!y || !m || !d || y === "undefined" || m === "undefined" || d === "undefined") {
    return "Date";
  }

  return `${d}-${m}-${y}`;
}

export function formatSavedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

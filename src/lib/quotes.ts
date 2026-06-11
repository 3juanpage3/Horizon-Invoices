import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteQuote as deleteQuoteFn, listQuotes, saveQuote } from "@/lib/api/quotes.functions";

export type QuoteLineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
};

export type SavedQuote = {
  id: string;
  quoteNo: string;
  date: string;
  email: string;
  cell: string;
  billToName: string;
  billToPhone: string;
  billToAddress: string;
  items: QuoteLineItem[];
  terms: string;
  total: number;
  savedAt: string;
};

export function useQuoteHistory() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["quotes"],
    queryFn: () => listQuotes(),
  });

  const saveMutation = useMutation({
    mutationFn: (quote: SavedQuote) => saveQuote({ data: quote }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuoteFn({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotes"] }),
  });

  return {
    quotes: query.data ?? [],
    saveQuote: (quote: SavedQuote) => saveMutation.mutate(quote),
    deleteQuote: (id: string) => deleteMutation.mutate(id),
    loaded: query.isFetched,
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
  };
}

export function searchQuotes(quotes: SavedQuote[], query: string): SavedQuote[] {
  const q = query.trim().toLowerCase();
  if (!q) return quotes;

  return quotes.filter((quote) => {
    const haystack = [
      quote.quoteNo,
      quote.date,
      quote.billToName,
      quote.billToPhone,
      quote.billToAddress,
      quote.email,
      quote.cell,
      quote.total.toFixed(2),
      ...quote.items.map((item) => item.description),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

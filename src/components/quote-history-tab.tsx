import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Trash2, FolderOpen } from "lucide-react";
import { formatDisplayDate, formatSavedAt } from "@/lib/invoices";
import { searchQuotes, type SavedQuote } from "@/lib/quotes";

type QuoteHistoryTabProps = {
  quotes: SavedQuote[];
  onLoad: (quote: SavedQuote) => void;
  onDelete: (id: string) => void;
};

export function QuoteHistoryTab({ quotes, onLoad, onDelete }: QuoteHistoryTabProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => searchQuotes(quotes, query), [quotes, query]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quote History</h3>
          <p className="text-sm text-muted-foreground">
            Search and reopen quotes saved to your account.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search quote #, client, date..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Saved</TableHead>
              <TableHead className="text-right w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  {quotes.length === 0
                    ? 'No saved quotes yet. Use "Save" on the Quote tab.'
                    : "No quotes match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.quoteNo || "—"}</TableCell>
                  <TableCell>{formatDisplayDate(quote.date)}</TableCell>
                  <TableCell>
                    <div>{quote.billToName || "—"}</div>
                    {quote.billToPhone ? (
                      <div className="text-xs text-muted-foreground">{quote.billToPhone}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">R{quote.total.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatSavedAt(quote.savedAt)}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLoad(quote)}
                      className="h-8 w-8 p-0"
                      title="Open quote"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(quote.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      title="Delete from history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {quotes.length} saved quote
        {quotes.length === 1 ? "" : "s"}.
      </p>
    </div>
  );
}

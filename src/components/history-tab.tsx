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
import {
  searchInvoices,
  formatDisplayDate,
  formatSavedAt,
  type SavedInvoice,
} from "@/lib/invoices";

type HistoryTabProps = {
  invoices: SavedInvoice[];
  onLoad: (invoice: SavedInvoice) => void;
  onDelete: (id: string) => void;
};

export function HistoryTab({ invoices, onLoad, onDelete }: HistoryTabProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => searchInvoices(invoices, query), [invoices, query]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invoice History</h3>
          <p className="text-sm text-muted-foreground">
            Search and reopen invoices saved to your account.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoice #, client, date..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
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
                  {invoices.length === 0
                    ? 'No saved invoices yet. Use "Save invoice" on the Invoice tab.'
                    : "No invoices match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoiceNo || "—"}</TableCell>
                  <TableCell>{formatDisplayDate(inv.date)}</TableCell>
                  <TableCell>
                    <div>{inv.billToName || "—"}</div>
                    {inv.billToPhone ? (
                      <div className="text-xs text-muted-foreground">{inv.billToPhone}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">R{inv.total.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatSavedAt(inv.savedAt)}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLoad(inv)}
                      className="h-8 w-8 p-0"
                      title="Open invoice"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(inv.id)}
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
        Showing {filtered.length} of {invoices.length} saved invoice
        {invoices.length === 1 ? "" : "s"}.
      </p>
    </div>
  );
}

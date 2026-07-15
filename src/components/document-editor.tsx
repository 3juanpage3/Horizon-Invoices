import { useMemo, type RefObject } from "react";
import logoAsset from "@/assets/main-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InventoryItem } from "@/lib/inventory";
import type { CompanySettings } from "@/lib/settings";
import type { SavedQuote } from "@/lib/quotes";

const logo = logoAsset.url;

export type LineItem = { id: string; description: string; qty: number; unitPrice: number };

export type DocumentVariant = "invoice" | "quote";

const variantConfig = {
  invoice: {
    detailsTitle: "Invoice details",
    numberLabel: "Invoice #",
    numberFieldLabel: "INVOICE #:",
    title: "INVOICE",
  },
  quote: {
    detailsTitle: "Quote details",
    numberLabel: "Quote #",
    numberFieldLabel: "QUOTE #:",
    title: "QUOTE",
  },
} as const;

type DocumentEditorProps = {
  variant: DocumentVariant;
  documentNo: string;
  onDocumentNoChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  cell: string;
  onCellChange: (value: string) => void;
  billToName: string;
  onBillToNameChange: (value: string) => void;
  billToPhone: string;
  onBillToPhoneChange: (value: string) => void;
  billToAddress: string;
  onBillToAddressChange: (value: string) => void;
  items: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
  terms: string;
  settings: CompanySettings;
  inventory: InventoryItem[];
  previewRef: RefObject<HTMLDivElement | null>;
  saveNotice?: string;
  quotes?: SavedQuote[];
  onLoadFromQuote?: (quoteId: string) => void;
  onAddFromInventory: (invId: string) => void;
  uid: () => string;
};

const fmt = (n: number) => n.toFixed(2);

export function DocumentEditor({
  variant,
  documentNo,
  onDocumentNoChange,
  date,
  onDateChange,
  email,
  onEmailChange,
  cell,
  onCellChange,
  billToName,
  onBillToNameChange,
  billToPhone,
  onBillToPhoneChange,
  billToAddress,
  onBillToAddressChange,
  items,
  onItemsChange,
  terms,
  settings,
  inventory,
  previewRef,
  saveNotice,
  quotes = [],
  onLoadFromQuote,
  onAddFromInventory,
  uid,
}: DocumentEditorProps) {
  const config = variantConfig[variant];

  const total = useMemo(() => items.reduce((s, it) => s + it.qty * it.unitPrice, 0), [items]);

  const formattedDate = useMemo(() => {
    if (!date) return "";
    const [y, m, d] = date.split("-");
    return `${d}-${m}-${y}`;
  }, [date]);

  const termsList = terms
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  const displayLogo = settings.logo || logo;

  const companyAddress = [
    settings.address,
    [settings.city, settings.postalCode].filter(Boolean).join(", "),
    settings.country,
    settings.website,
  ]
    .filter(Boolean)
    .join("\n");

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    onItemsChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  return (
    <>
      {saveNotice ? (
        <p className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {saveNotice}
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-6">
          <section className="space-y-3 rounded-lg border bg-background p-4">
            <h2 className="text-sm font-semibold">{config.detailsTitle}</h2>
            {variant === "invoice" && quotes.length > 0 && onLoadFromQuote ? (
              <div className="grid gap-2">
                <Label>Load from quote</Label>
                <Select value="" onValueChange={(v) => onLoadFromQuote(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a saved quote…" />
                  </SelectTrigger>
                  <SelectContent>
                    {quotes.map((quote) => (
                      <SelectItem key={quote.id} value={quote.id}>
                        {quote.quoteNo || "(no number)"} — {quote.billToName || "Client"} — R
                        {quote.total.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label>{config.numberLabel}</Label>
              <Input value={documentNo} onChange={(e) => onDocumentNoChange(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
            </div>
          </section>

          <section className="space-y-3 rounded-lg border bg-background p-4">
            <h2 className="text-sm font-semibold">Our contact info</h2>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => onEmailChange(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Cell</Label>
              <Input value={cell} onChange={(e) => onCellChange(e.target.value)} />
            </div>
          </section>

          <section className="space-y-3 rounded-lg border bg-background p-4">
            <h2 className="text-sm font-semibold">Bill to</h2>
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={billToName} onChange={(e) => onBillToNameChange(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input value={billToPhone} onChange={(e) => onBillToPhoneChange(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Textarea
                rows={2}
                value={billToAddress}
                onChange={(e) => onBillToAddressChange(e.target.value)}
              />
            </div>
          </section>

          <section className="space-y-3 rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Line items</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onItemsChange([...items, { id: uid(), description: "", qty: 1, unitPrice: 0 }])
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
            {inventory.length > 0 && (
              <div className="grid gap-2">
                <Label className="text-xs">Add from inventory</Label>
                <Select value="" onValueChange={(v) => onAddFromInventory(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a stock item…" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.name || inv.description || "(untitled)"} — {fmt(inv.unitPrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="space-y-2 rounded-md border p-3">
                  <Textarea
                    rows={2}
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => updateItem(it.id, { description: e.target.value })}
                  />
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <div>
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min={0}
                        value={it.qty}
                        onChange={(e) => updateItem(it.id, { qty: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unit price</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={it.unitPrice}
                        onChange={(e) =>
                          updateItem(it.id, { unitPrice: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="self-end"
                      onClick={() => onItemsChange(items.filter((x) => x.id !== it.id))}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main>
          <div className="overflow-auto rounded-lg border bg-neutral-200 p-4 shadow-inner">
            <div
              ref={previewRef}
              className="mx-auto bg-white text-black shadow-md"
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "14mm 14mm",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "11px",
                lineHeight: 1.4,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  columnGap: 24,
                  rowGap: 8,
                  alignItems: "start",
                }}
              >
                <img
                  src={displayLogo}
                  alt={settings.companyName}
                  style={{
                    display: "block",
                    gridColumn: 1,
                    gridRow: "1 / 3",
                    height: 260,
                    width: "auto",
                    maxWidth: 440,
                    objectFit: "contain",
                    objectPosition: "left top",
                  }}
                />
                <h1
                  style={{
                    gridColumn: 2,
                    gridRow: 1,
                    justifySelf: "end",
                    fontSize: 32,
                    fontWeight: 700,
                    letterSpacing: 1,
                    margin: 0,
                  }}
                >
                  {config.title}
                </h1>
                <div
                  style={{
                    gridColumn: 2,
                    gridRow: 2,
                    justifySelf: "end",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    width: 260,
                  }}
                >
                  <InfoRow label={config.numberFieldLabel} value={documentNo} />
                  <InfoRow label="DATE:" value={formattedDate} center />
                </div>
                <div style={{ gridColumn: 1, gridRow: 3, fontSize: 11 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{settings.companyName}</div>
                  {settings.contactPerson ? <div>{settings.contactPerson}</div> : null}
                  {companyAddress
                    ? companyAddress.split("\n").map((line, i) => <div key={i}>{line}</div>)
                    : null}
                  <div style={{ marginTop: 4 }}>
                    <b>Email:</b> &nbsp;{email}
                  </div>
                  <div>
                    <b>Cell:</b> &nbsp;&nbsp;&nbsp;{cell}
                  </div>
                  {settings.vatNumber ? (
                    <div>
                      <b>VAT:</b> &nbsp;&nbsp;{settings.vatNumber}
                    </div>
                  ) : null}
                  {settings.businessRegistration ? (
                    <div>
                      <b>Reg:</b> &nbsp;&nbsp;{settings.businessRegistration}
                    </div>
                  ) : null}
                </div>
                <div
                  style={{
                    gridColumn: 2,
                    gridRow: 3,
                    justifySelf: "end",
                    width: 260,
                    border: "1px solid #a3a3a3",
                    borderRadius: 6,
                    padding: 8,
                  }}
                >
                  <div className="font-bold">BILL TO:</div>
                  <div>{billToName}</div>
                  <div>{billToPhone}</div>
                  {billToAddress.split("\n").map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div
                  className="text-center font-bold"
                  style={{
                    display: "grid",
                    alignItems: "center",
                    gridTemplateColumns: "1.8fr 0.5fr 0.7fr 0.7fr",
                    background: "#cfe3f0",
                    border: "1px solid #9ec6db",
                    padding: "8px 0",
                    gap: 0,
                  }}
                >
                  <div>DESCRIPTION</div>
                  <div style={{ borderLeft: "1px solid #9ec6db" }}>QTY</div>
                  <div style={{ borderLeft: "1px solid #9ec6db" }}>UNIT PRICE</div>
                  <div style={{ borderLeft: "1px solid #9ec6db" }}>AMOUNT</div>
                </div>
                <div className="mt-2 space-y-2">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        display: "grid",
                        alignItems: "center",
                        gridTemplateColumns: "1.8fr 0.5fr 0.7fr 0.7fr",
                        border: "1px solid #cfd6db",
                        minHeight: 48,
                      }}
                    >
                      <div style={{ padding: "8px 10px" }}>{it.description}</div>
                      <div
                        style={{
                          borderLeft: "1px solid #cfd6db",
                          textAlign: "center",
                          padding: 6,
                        }}
                      >
                        {it.qty}
                      </div>
                      <div
                        style={{
                          borderLeft: "1px solid #cfd6db",
                          textAlign: "center",
                          padding: 6,
                        }}
                      >
                        {fmt(it.unitPrice)}
                      </div>
                      <div
                        style={{
                          borderLeft: "1px solid #cfd6db",
                          textAlign: "center",
                          padding: 6,
                        }}
                      >
                        {fmt(it.qty * it.unitPrice)}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: "grid",
                    alignItems: "center",
                    gridTemplateColumns: "1.8fr 1.9fr",
                  }}
                >
                  <div className="italic text-center" style={{ fontSize: 12 }}>
                    Thank you for your business!
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      border: "1px solid #9ec6db",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        background: "#cfe3f0",
                        textAlign: "center",
                        padding: "8px 0",
                        fontWeight: 700,
                      }}
                    >
                      TOTAL
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "8px 0",
                        borderLeft: "1px solid #9ec6db",
                      }}
                    >
                      {fmt(total)}
                    </div>
                  </div>
                </div>
              </div>

              {settings.bankDetails ? (
                <div style={{ marginTop: 16, fontSize: 11 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Bank Details:</div>
                  {settings.bankDetails.split("\n").map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              ) : null}

              <div style={{ marginTop: 24 }}>
                <h2
                  style={{
                    fontWeight: 700,
                    textDecoration: "underline",
                    fontSize: 13,
                    margin: 0,
                  }}
                >
                  GENERAL TERMS &amp; CONDITIONS
                </h2>
                <div style={{ marginTop: 6 }}>
                  {termsList.map((t, i) => (
                    <div key={i} style={{ marginBottom: 2 }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: 32,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 40,
                }}
              >
                <div>
                  <div style={{ borderBottom: "1px solid #9aa3ab", height: 36 }} />
                  <div className="mt-1">The Client</div>
                </div>
                <div>
                  <div style={{ borderBottom: "1px solid #9aa3ab", height: 36 }} />
                  <div className="mt-1">{settings.companyName}</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function InfoRow({ label, value, center }: { label: string; value: string; center?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "110px 1fr",
        border: "1px solid #9ec6db",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <div style={{ background: "#cfe3f0", padding: "6px 8px", fontWeight: 700 }}>{label}</div>
      <div
        style={{
          padding: "6px 8px",
          borderLeft: "1px solid #9ec6db",
          textAlign: center ? "center" : "left",
        }}
      >
        {value}
      </div>
    </div>
  );
}

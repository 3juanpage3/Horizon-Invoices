import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import logoAsset from "@/assets/main-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Download, Package, Settings, LogOut, History, Save, FilePlus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventory } from "@/lib/inventory";
import { useAuth } from "@/lib/use-auth";
import { useCompanySettings } from "@/lib/use-company-settings";
import { getSession } from "@/lib/api/auth.functions";
import { InventoryTab } from "@/components/inventory-tab";
import { SettingsTab } from "@/components/settings-tab";
import { HistoryTab } from "@/components/history-tab";
import { useInvoiceHistory, type SavedInvoice } from "@/lib/invoices";

const logo = logoAsset.url;

export const Route = createFileRoute("/")({
  loader: async () => {
    const session = await getSession();
    if (!session.user) throw redirect({ to: "/login" });
    if (!session.hasCompany) throw redirect({ to: "/setup" });
    return session;
  },
  head: () => ({
    meta: [
      { title: "Horizon Invoices" },
      {
        name: "description",
        content: "Create and download professional invoices with Horizon Invoices.",
      },
      { property: "og:title", content: "Horizon Invoices" },
      {
        property: "og:description",
        content: "Create and download professional invoices with Horizon Invoices.",
      },
    ],
  }),
  component: Index,
});

type LineItem = { id: string; description: string; qty: number; unitPrice: number };

const DEFAULT_TERMS = [
  "K & H Jumping Castles will not be responsible for any loss or injury when our equipment are being used.",
  "The use of our equipment is at your own risk. If stolen or damaged the client will be held responsible for the replacement of the item unless mutually agreed to by both parties.",
  "There most always be an adult present and supervising the children.",
  "No children may come near the motor.",
  "No food or drinks on the inflatable.",
  "Make sure no one wears shoes or any sharp objects.",
  "Setting up the equipment in a flat clean area with no sharp objects on the ground preferarbly on grass.",
  "K & H Jumping Castles does not accept any responsibility for weather conditions.",
  "In case of rain deflate the item and fold it in half to keep the water from getting in.",
  "If the motor got wet and is damaged it's the clients responsibility to replace it.",
  "K & H Jumping Castles will not be responsible for the supplying of the extension cord to the motor.",
  "Be aware of your pets that can damage the inflatable.",
  "Please do not spray or play with paint near the inflatable!!! Most of them does not come off!!!!",
];

const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n: number) => n.toFixed(2);

function Index() {
  const navigate = useNavigate();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { settings, isLoading: settingsLoading } = useCompanySettings();
  const [invoiceNo, setInvoiceNo] = useState("Lizzie 25 and 26 Dec");
  const [date, setDate] = useState("2025-12-03");
  const [email, setEmail] = useState(settings.email || "kandhjump@gmail.com");
  const [cell, setCell] = useState(settings.phone || "084 445 6084");
  const [billToName, setBillToName] = useState("Lizzie");
  const [billToPhone, setBillToPhone] = useState("063-241-0457");
  const [billToAddress, setBillToAddress] = useState("20 Barend street\nWitpoortjie");
  const [items, setItems] = useState<LineItem[]>([
    {
      id: "default-item",
      description: "3-in-1 Jumping Castle (3.75x7 meters, 25th & 26th Dec 2025)",
      qty: 1,
      unitPrice: 275,
    },
  ]);
  const [terms, setTerms] = useState(DEFAULT_TERMS.join("\n"));
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<"invoice" | "history" | "inventory" | "settings">("invoice");
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState("");
  const { items: inventory } = useInventory();
  const { invoices, saveInvoice, deleteInvoice } = useInvoiceHistory();

  // Update email and phone from settings
  useEffect(() => {
    if (settings.email) setEmail(settings.email);
    if (settings.phone) setCell(settings.phone);
  }, [settings.email, settings.phone]);

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
  ]
    .filter(Boolean)
    .join("\n");

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const addFromInventory = (invId: string) => {
    const inv = inventory.find((x) => x.id === invId);
    if (!inv) return;
    setItems((p) => [
      ...p,
      { id: uid(), description: inv.description || inv.name, qty: 1, unitPrice: inv.unitPrice },
    ]);
  };

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const buildSavedInvoice = (): SavedInvoice => ({
    id: activeInvoiceId ?? uid(),
    invoiceNo,
    date,
    email,
    cell,
    billToName,
    billToPhone,
    billToAddress,
    items,
    terms,
    total,
    savedAt: new Date().toISOString(),
  });

  const saveCurrentInvoice = () => {
    const saved = buildSavedInvoice();
    if (!activeInvoiceId) setActiveInvoiceId(saved.id);
    saveInvoice(saved);
    setSaveNotice("Invoice saved to history.");
    window.setTimeout(() => setSaveNotice(""), 2500);
  };

  const loadInvoiceFromHistory = (invoice: SavedInvoice) => {
    setActiveInvoiceId(invoice.id);
    setInvoiceNo(invoice.invoiceNo);
    setDate(invoice.date);
    setEmail(invoice.email);
    setCell(invoice.cell);
    setBillToName(invoice.billToName);
    setBillToPhone(invoice.billToPhone);
    setBillToAddress(invoice.billToAddress);
    setItems(invoice.items);
    setTerms(invoice.terms);
    setTab("invoice");
  };

  const startNewInvoice = () => {
    setActiveInvoiceId(null);
    setInvoiceNo("");
    setDate(new Date().toISOString().slice(0, 10));
    setEmail(settings.email || "");
    setCell(settings.phone || "");
    setBillToName("");
    setBillToPhone("");
    setBillToAddress("");
    setItems([{ id: uid(), description: "", qty: 1, unitPrice: 0 }]);
    setTerms(DEFAULT_TERMS.join("\n"));
  };

  const downloadPdf = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      const h = Math.min(imgH, pageH);
      pdf.addImage(img, "PNG", 0, 0, pageW, h);
      const safe = invoiceNo.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "invoice";
      pdf.save(`invoice-${safe}.pdf`);
      saveCurrentInvoice();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={displayLogo} alt={settings.companyName} className="h-10 w-auto" />
            <div>
              <h1 className="text-base font-semibold leading-tight">Horizon Invoices</h1>
              <p className="text-xs text-muted-foreground">{settings.companyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <p className="text-muted-foreground">Logged in as:</p>
              <p className="font-semibold">{user?.username}</p>
            </div>
            {tab === "invoice" ? (
              <>
                <Button variant="outline" onClick={startNewInvoice} className="gap-2">
                  <FilePlus className="h-4 w-4" />
                  New
                </Button>
                <Button variant="outline" onClick={saveCurrentInvoice} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button onClick={downloadPdf} disabled={exporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? "Generating..." : "Download PDF"}
                </Button>
              </>
            ) : null}
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "invoice" | "history" | "inventory" | "settings")}
        className="mx-auto w-full max-w-7xl px-4 pt-4"
      >
        <TabsList>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1 h-4 w-4" /> History
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="mr-1 h-4 w-4" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-1 h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoice" className="mt-4">
          {saveNotice ? (
            <p className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {saveNotice}
            </p>
          ) : null}
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            {/* FORM */}
            <aside className="space-y-6">
              <section className="space-y-3 rounded-lg border bg-background p-4">
                <h2 className="text-sm font-semibold">Invoice details</h2>
                <div className="grid gap-2">
                  <Label>Invoice #</Label>
                  <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </section>

              <section className="space-y-3 rounded-lg border bg-background p-4">
                <h2 className="text-sm font-semibold">Our contact info</h2>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Cell</Label>
                  <Input value={cell} onChange={(e) => setCell(e.target.value)} />
                </div>
              </section>

              <section className="space-y-3 rounded-lg border bg-background p-4">
                <h2 className="text-sm font-semibold">Bill to</h2>
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={billToName} onChange={(e) => setBillToName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={billToPhone} onChange={(e) => setBillToPhone(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <Textarea
                    rows={2}
                    value={billToAddress}
                    onChange={(e) => setBillToAddress(e.target.value)}
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
                      setItems((p) => [...p, { id: uid(), description: "", qty: 1, unitPrice: 0 }])
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </div>
                {inventory.length > 0 && (
                  <div className="grid gap-2">
                    <Label className="text-xs">Add from inventory</Label>
                    <Select value="" onValueChange={(v) => addFromInventory(v)}>
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
                            onChange={(e) =>
                              updateItem(it.id, { qty: Number(e.target.value) || 0 })
                            }
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
                          onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3 rounded-lg border bg-background p-4">
                <h2 className="text-sm font-semibold">Terms &amp; conditions</h2>
                <p className="text-xs text-muted-foreground">One per line.</p>
                <Textarea
                  rows={10}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="font-mono text-xs"
                />
              </section>
            </aside>

            {/* PREVIEW */}
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
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <img src={displayLogo} alt={settings.companyName} style={{ height: 90 }} />
                    <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: 1, margin: 0 }}>
                      INVOICE
                    </h1>
                  </div>

                  {/* Top info row */}
                  <div
                    style={{
                      marginTop: 16,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 24,
                    }}
                  >
                    <div style={{ fontSize: 11 }}>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <InfoRow label="INVOICE #:" value={invoiceNo} />
                      <InfoRow label="DATE:" value={formattedDate} center />
                    </div>
                  </div>

                  {/* Bill to */}
                  <div
                    style={{
                      marginTop: 16,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 24,
                    }}
                  >
                    <div />
                    <div style={{ border: "1px solid #a3a3a3", borderRadius: 6, padding: 8 }}>
                      <div className="font-bold">BILL TO:</div>
                      <div>{billToName}</div>
                      <div>{billToPhone}</div>
                      {billToAddress.split("\n").map((l, i) => (
                        <div key={i}>{l}</div>
                      ))}
                    </div>
                  </div>

                  {/* Items table */}
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

                    {/* Total */}
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

                  {/* Terms */}
                  <div className="mt-6">
                    <h2 style={{ fontWeight: 700, textDecoration: "underline", fontSize: 13 }}>
                      GENERAL TERMS &amp; CONDITIONS
                    </h2>
                    <ol style={{ paddingLeft: 20, marginTop: 6 }}>
                      {termsList.map((t, i) => (
                        <li key={i} style={{ marginBottom: 2 }}>
                          <span style={{ marginLeft: -4 }}>{t}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-2">
                      The client has read this and understands the conditions from K &amp; H Jumping
                      Castles
                    </p>
                  </div>

                  {/* Signatures */}
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
        </TabsContent>

        <TabsContent value="history" className="mt-4 pb-10">
          <div className="rounded-lg border bg-background">
            <HistoryTab
              invoices={invoices}
              onLoad={loadInvoiceFromHistory}
              onDelete={(id) => {
                deleteInvoice(id);
                if (activeInvoiceId === id) setActiveInvoiceId(null);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4 pb-10">
          <div className="rounded-lg border bg-background">
            <InventoryTab />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 pb-10">
          <div className="rounded-lg border bg-background">
            <SettingsTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
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

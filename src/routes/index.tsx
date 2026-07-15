import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect, type RefObject } from "react";
import logoAsset from "@/assets/main-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import {
  Download,
  Package,
  Settings,
  LogOut,
  History,
  Save,
  FilePlus,
  FileText,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useInventory } from "@/lib/inventory";
import { useAuth } from "@/lib/use-auth";
import { useCompanySettings } from "@/lib/use-company-settings";
import { getDefaultLineItems, type CompanySettings } from "@/lib/settings";
import { loadSession } from "@/lib/load-session";
import { InventoryTab } from "@/components/inventory-tab";
import { SettingsTab } from "@/components/settings-tab";
import { HistoryTab } from "@/components/history-tab";
import { QuoteHistoryTab } from "@/components/quote-history-tab";
import { DocumentEditor, type LineItem } from "@/components/document-editor";
import { useInvoiceHistory, type SavedInvoice } from "@/lib/invoices";
import { useQuoteHistory, type SavedQuote } from "@/lib/quotes";

const logo = logoAsset.url;

export const Route = createFileRoute("/")({
  loader: async () => {
    const session = await loadSession();
    if (!session.user) throw redirect({ to: "/login" });
    if (!session.hasCompany) throw redirect({ to: "/setup" });
    return session;
  },
  head: () => ({
    meta: [
      { title: "Horizon Invoices" },
      {
        name: "description",
        content: "Create and download professional invoices and quotes with Horizon Invoices.",
      },
      { property: "og:title", content: "Horizon Invoices" },
      {
        property: "og:description",
        content: "Create and download professional invoices and quotes with Horizon Invoices.",
      },
    ],
  }),
  component: Index,
});

const uid = () => Math.random().toString(36).slice(2, 9);

const toLineItems = (settings: CompanySettings): LineItem[] =>
  getDefaultLineItems(settings).map((item) => ({ id: uid(), ...item }));

type AppTab = "invoice" | "quote" | "history" | "quote-history" | "inventory" | "settings";

function Index() {
  const navigate = useNavigate();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { settings, isLoading: settingsLoading } = useCompanySettings();

  const [invoiceNo, setInvoiceNo] = useState("Invoice #");
  const [invoiceDate, setInvoiceDate] = useState("Date");
  const [invoiceEmail, setInvoiceEmail] = useState(settings.email || "email");
  const [invoiceCell, setInvoiceCell] = useState(settings.phone || " cell");
  const [invoiceBillToName, setInvoiceBillToName] = useState("name");
  const [invoiceBillToPhone, setInvoiceBillToPhone] = useState("phone");
  const [invoiceBillToAddress, setInvoiceBillToAddress] = useState("street\n city");
  const [invoiceItems, setInvoiceItems] = useState<LineItem[]>([]);
  const [invoiceTerms, setInvoiceTerms] = useState("");
  const [invoiceDefaultsApplied, setInvoiceDefaultsApplied] = useState(false);
  const invoicePreviewRef = useRef<HTMLDivElement>(null);
  const [invoiceExporting, setInvoiceExporting] = useState(false);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [invoiceSaveNotice, setInvoiceSaveNotice] = useState("");

  const [quoteNo, setQuoteNo] = useState("Quote #");
  const [quoteDate, setQuoteDate] = useState("Date");
  const [quoteEmail, setQuoteEmail] = useState(settings.email || "email");
  const [quoteCell, setQuoteCell] = useState(settings.phone || " cell");
  const [quoteBillToName, setQuoteBillToName] = useState("name");
  const [quoteBillToPhone, setQuoteBillToPhone] = useState("phone");
  const [quoteBillToAddress, setQuoteBillToAddress] = useState("street\n city");
  const [quoteItems, setQuoteItems] = useState<LineItem[]>([]);
  const [quoteTerms, setQuoteTerms] = useState("");
  const [quoteDefaultsApplied, setQuoteDefaultsApplied] = useState(false);
  const quotePreviewRef = useRef<HTMLDivElement>(null);
  const [quoteExporting, setQuoteExporting] = useState(false);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [quoteSaveNotice, setQuoteSaveNotice] = useState("");

  const [tab, setTab] = useState<AppTab>("invoice");
  const { items: inventory } = useInventory();
  const { invoices, saveInvoice, deleteInvoice } = useInvoiceHistory();
  const { quotes, saveQuote, deleteQuote } = useQuoteHistory();

  useEffect(() => {
    if (settings.email) {
      setInvoiceEmail(settings.email);
      setQuoteEmail(settings.email);
    }
    if (settings.phone) {
      setInvoiceCell(settings.phone);
      setQuoteCell(settings.phone);
    }
  }, [settings.email, settings.phone]);

  useEffect(() => {
    if (settingsLoading || invoiceDefaultsApplied || activeInvoiceId) return;
    setInvoiceItems(toLineItems(settings));
    setInvoiceTerms(settings.defaultTerms);
    setInvoiceDefaultsApplied(true);
  }, [settingsLoading, settings, invoiceDefaultsApplied, activeInvoiceId]);

  useEffect(() => {
    if (settingsLoading || quoteDefaultsApplied || activeQuoteId) return;
    setQuoteItems(toLineItems(settings));
    setQuoteTerms(settings.defaultTerms);
    setQuoteDefaultsApplied(true);
  }, [settingsLoading, settings, quoteDefaultsApplied, activeQuoteId]);

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

  const displayLogo = settings.logo || logo;

  const addFromInventoryToInvoice = (invId: string) => {
    const inv = inventory.find((x) => x.id === invId);
    if (!inv) return;
    setInvoiceItems((p) => [
      ...p,
      { id: uid(), description: inv.description || inv.name, qty: 1, unitPrice: inv.unitPrice },
    ]);
  };

  const addFromInventoryToQuote = (invId: string) => {
    const inv = inventory.find((x) => x.id === invId);
    if (!inv) return;
    setQuoteItems((p) => [
      ...p,
      { id: uid(), description: inv.description || inv.name, qty: 1, unitPrice: inv.unitPrice },
    ]);
  };

  const invoiceTotal = invoiceItems.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const quoteTotal = quoteItems.reduce((s, it) => s + it.qty * it.unitPrice, 0);

  const buildSavedInvoice = (): SavedInvoice => ({
    id: activeInvoiceId ?? uid(),
    invoiceNo,
    date: invoiceDate,
    email: invoiceEmail,
    cell: invoiceCell,
    billToName: invoiceBillToName,
    billToPhone: invoiceBillToPhone,
    billToAddress: invoiceBillToAddress,
    items: invoiceItems,
    terms: invoiceTerms,
    total: invoiceTotal,
    savedAt: new Date().toISOString(),
  });

  const buildSavedQuote = (): SavedQuote => ({
    id: activeQuoteId ?? uid(),
    quoteNo,
    date: quoteDate,
    email: quoteEmail,
    cell: quoteCell,
    billToName: quoteBillToName,
    billToPhone: quoteBillToPhone,
    billToAddress: quoteBillToAddress,
    items: quoteItems,
    terms: quoteTerms,
    total: quoteTotal,
    savedAt: new Date().toISOString(),
  });

  const saveCurrentInvoice = () => {
    const saved = buildSavedInvoice();
    if (!activeInvoiceId) setActiveInvoiceId(saved.id);
    saveInvoice(saved);
    setInvoiceSaveNotice("Invoice saved to history.");
    window.setTimeout(() => setInvoiceSaveNotice(""), 2500);
  };

  const saveCurrentQuote = () => {
    const saved = buildSavedQuote();
    if (!activeQuoteId) setActiveQuoteId(saved.id);
    saveQuote(saved);
    setQuoteSaveNotice("Quote saved to history.");
    window.setTimeout(() => setQuoteSaveNotice(""), 2500);
  };

  const loadInvoiceFromHistory = (invoice: SavedInvoice) => {
    setActiveInvoiceId(invoice.id);
    setInvoiceNo(invoice.invoiceNo);
    setInvoiceDate(invoice.date);
    setInvoiceEmail(invoice.email);
    setInvoiceCell(invoice.cell);
    setInvoiceBillToName(invoice.billToName);
    setInvoiceBillToPhone(invoice.billToPhone);
    setInvoiceBillToAddress(invoice.billToAddress);
    setInvoiceItems(invoice.items);
    setInvoiceTerms(invoice.terms);
    setTab("invoice");
  };

  const loadQuoteFromHistory = (quote: SavedQuote) => {
    setActiveQuoteId(quote.id);
    setQuoteNo(quote.quoteNo);
    setQuoteDate(quote.date);
    setQuoteEmail(quote.email);
    setQuoteCell(quote.cell);
    setQuoteBillToName(quote.billToName);
    setQuoteBillToPhone(quote.billToPhone);
    setQuoteBillToAddress(quote.billToAddress);
    setQuoteItems(quote.items);
    setQuoteTerms(quote.terms);
    setTab("quote");
  };

  const loadQuoteIntoInvoice = (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;
    setActiveInvoiceId(null);
    setInvoiceNo("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setInvoiceEmail(quote.email);
    setInvoiceCell(quote.cell);
    setInvoiceBillToName(quote.billToName);
    setInvoiceBillToPhone(quote.billToPhone);
    setInvoiceBillToAddress(quote.billToAddress);
    setInvoiceItems(quote.items.map((item) => ({ ...item, id: uid() })));
    setInvoiceTerms(quote.terms);
    setInvoiceSaveNotice(`Loaded quote ${quote.quoteNo || "(no number)"} into invoice.`);
    window.setTimeout(() => setInvoiceSaveNotice(""), 2500);
  };

  const startNewInvoice = () => {
    setActiveInvoiceId(null);
    setInvoiceNo("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setInvoiceEmail(settings.email || "");
    setInvoiceCell(settings.phone || "");
    setInvoiceBillToName("");
    setInvoiceBillToPhone("");
    setInvoiceBillToAddress("");
    setInvoiceItems(toLineItems(settings));
    setInvoiceTerms(settings.defaultTerms);
  };

  const startNewQuote = () => {
    setActiveQuoteId(null);
    setQuoteNo("");
    setQuoteDate(new Date().toISOString().slice(0, 10));
    setQuoteEmail(settings.email || "");
    setQuoteCell(settings.phone || "");
    setQuoteBillToName("");
    setQuoteBillToPhone("");
    setQuoteBillToAddress("");
    setQuoteItems(toLineItems(settings));
    setQuoteTerms(settings.defaultTerms);
  };

  const downloadPdf = async (
    previewRef: RefObject<HTMLDivElement | null>,
    docNo: string,
    prefix: "invoice" | "quote",
    onSave: () => void,
    setExporting: (v: boolean) => void,
  ) => {
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
      const safe = docNo.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || prefix;
      pdf.save(`${prefix}-${safe}.pdf`);
      onSave();
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
                <Button
                  onClick={() =>
                    downloadPdf(
                      invoicePreviewRef,
                      invoiceNo,
                      "invoice",
                      saveCurrentInvoice,
                      setInvoiceExporting,
                    )
                  }
                  disabled={invoiceExporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {invoiceExporting ? "Generating..." : "Download PDF"}
                </Button>
              </>
            ) : null}
            {tab === "quote" ? (
              <>
                <Button variant="outline" onClick={startNewQuote} className="gap-2">
                  <FilePlus className="h-4 w-4" />
                  New
                </Button>
                <Button variant="outline" onClick={saveCurrentQuote} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  onClick={() =>
                    downloadPdf(
                      quotePreviewRef,
                      quoteNo,
                      "quote",
                      saveCurrentQuote,
                      setQuoteExporting,
                    )
                  }
                  disabled={quoteExporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {quoteExporting ? "Generating..." : "Download PDF"}
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
        onValueChange={(v) => setTab(v as AppTab)}
        className="mx-auto w-full max-w-7xl px-4 pt-4"
      >
        <TabsList>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="quote">
            <FileText className="mr-1 h-4 w-4" /> Quote
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1 h-4 w-4" /> Invoice History
          </TabsTrigger>
          <TabsTrigger value="quote-history">
            <History className="mr-1 h-4 w-4" /> Quote History
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="mr-1 h-4 w-4" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-1 h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoice" className="mt-4">
          <DocumentEditor
            variant="invoice"
            documentNo={invoiceNo}
            onDocumentNoChange={setInvoiceNo}
            date={invoiceDate}
            onDateChange={setInvoiceDate}
            email={invoiceEmail}
            onEmailChange={setInvoiceEmail}
            cell={invoiceCell}
            onCellChange={setInvoiceCell}
            billToName={invoiceBillToName}
            onBillToNameChange={setInvoiceBillToName}
            billToPhone={invoiceBillToPhone}
            onBillToPhoneChange={setInvoiceBillToPhone}
            billToAddress={invoiceBillToAddress}
            onBillToAddressChange={setInvoiceBillToAddress}
            items={invoiceItems}
            onItemsChange={setInvoiceItems}
            terms={invoiceTerms}
            settings={settings}
            inventory={inventory}
            previewRef={invoicePreviewRef}
            saveNotice={invoiceSaveNotice}
            quotes={quotes}
            onLoadFromQuote={loadQuoteIntoInvoice}
            onAddFromInventory={addFromInventoryToInvoice}
            uid={uid}
          />
        </TabsContent>

        <TabsContent value="quote" className="mt-4">
          <DocumentEditor
            variant="quote"
            documentNo={quoteNo}
            onDocumentNoChange={setQuoteNo}
            date={quoteDate}
            onDateChange={setQuoteDate}
            email={quoteEmail}
            onEmailChange={setQuoteEmail}
            cell={quoteCell}
            onCellChange={setQuoteCell}
            billToName={quoteBillToName}
            onBillToNameChange={setQuoteBillToName}
            billToPhone={quoteBillToPhone}
            onBillToPhoneChange={setQuoteBillToPhone}
            billToAddress={quoteBillToAddress}
            onBillToAddressChange={setQuoteBillToAddress}
            items={quoteItems}
            onItemsChange={setQuoteItems}
            terms={quoteTerms}
            settings={settings}
            inventory={inventory}
            previewRef={quotePreviewRef}
            saveNotice={quoteSaveNotice}
            onAddFromInventory={addFromInventoryToQuote}
            uid={uid}
          />
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

        <TabsContent value="quote-history" className="mt-4 pb-10">
          <div className="rounded-lg border bg-background">
            <QuoteHistoryTab
              quotes={quotes}
              onLoad={loadQuoteFromHistory}
              onDelete={(id) => {
                deleteQuote(id);
                if (activeQuoteId === id) setActiveQuoteId(null);
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

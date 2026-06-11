import { z } from "zod";

export const companySettingsSchema = z.object({
  companyName: z.string().min(1),
  contactPerson: z.string().optional().default(""),
  email: z.string().default(""),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  country: z.string().optional().default(""),
  vatNumber: z.string().optional().default(""),
  businessRegistration: z.string().optional().default(""),
  bankDetails: z.string().optional().default(""),
  logo: z.string().optional(),
  defaultTerms: z.string().optional().default(""),
  defaultLineItemDescription: z.string().optional().default(""),
  defaultLineItemQty: z.number().optional().default(1),
  defaultLineItemUnitPrice: z.number().optional().default(0),
});

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  unitPrice: z.number(),
});

export const invoiceLineItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  qty: z.number(),
  unitPrice: z.number(),
});

export const savedInvoiceSchema = z.object({
  id: z.string(),
  invoiceNo: z.string(),
  date: z.string(),
  email: z.string(),
  cell: z.string(),
  billToName: z.string(),
  billToPhone: z.string(),
  billToAddress: z.string(),
  items: z.array(invoiceLineItemSchema),
  terms: z.string(),
  total: z.number(),
  savedAt: z.string(),
});

export const savedQuoteSchema = z.object({
  id: z.string(),
  quoteNo: z.string(),
  date: z.string(),
  email: z.string(),
  cell: z.string(),
  billToName: z.string(),
  billToPhone: z.string(),
  billToAddress: z.string(),
  items: z.array(invoiceLineItemSchema),
  terms: z.string(),
  total: z.number(),
  savedAt: z.string(),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

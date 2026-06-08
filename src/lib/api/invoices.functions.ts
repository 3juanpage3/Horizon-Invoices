import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireUserId } from "../auth.server";
import { ensureIndexes, getDb } from "../db.server";
import { savedInvoiceSchema } from "../schemas";

export const listInvoices = createServerFn({ method: "GET" }).handler(async () => {
  await ensureIndexes();
  const userId = await requireUserId();
  const db = await getDb();
  const invoices = await db
    .collection("invoices")
    .find({ userId })
    .sort({ savedAt: -1 })
    .toArray();

  return invoices.map((inv) => ({
    id: inv.id as string,
    invoiceNo: inv.invoiceNo as string,
    date: inv.date as string,
    email: inv.email as string,
    cell: inv.cell as string,
    billToName: inv.billToName as string,
    billToPhone: inv.billToPhone as string,
    billToAddress: inv.billToAddress as string,
    items: inv.items as Array<{ id: string; description: string; qty: number; unitPrice: number }>,
    terms: inv.terms as string,
    total: inv.total as number,
    savedAt: inv.savedAt as string,
  }));
});

export const saveInvoice = createServerFn({ method: "POST" })
  .inputValidator(savedInvoiceSchema)
  .handler(async ({ data }) => {
    await ensureIndexes();
    const userId = await requireUserId();
    const db = await getDb();

    await db.collection("invoices").updateOne(
      { userId, id: data.id },
      {
        $set: {
          userId,
          ...data,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    return { success: true };
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureIndexes();
    const userId = await requireUserId();
    const db = await getDb();
    await db.collection("invoices").deleteOne({ userId, id: data.id });
    return { success: true };
  });

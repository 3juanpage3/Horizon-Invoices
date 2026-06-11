import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { savedQuoteSchema } from "../schemas";

export const listQuotes = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUserId } = await import("../auth.server");
  const { ensureIndexes, getDb } = await import("../db.server");

  await ensureIndexes();
  const userId = await requireUserId();
  const db = await getDb();
  const quotes = await db
    .collection("quotes")
    .find({ userId })
    .sort({ savedAt: -1 })
    .toArray();

  return quotes.map((quote) => ({
    id: quote.id as string,
    quoteNo: quote.quoteNo as string,
    date: quote.date as string,
    email: quote.email as string,
    cell: quote.cell as string,
    billToName: quote.billToName as string,
    billToPhone: quote.billToPhone as string,
    billToAddress: quote.billToAddress as string,
    items: quote.items as Array<{ id: string; description: string; qty: number; unitPrice: number }>,
    terms: quote.terms as string,
    total: quote.total as number,
    savedAt: quote.savedAt as string,
  }));
});

export const saveQuote = createServerFn({ method: "POST" })
  .inputValidator(savedQuoteSchema)
  .handler(async ({ data }) => {
    const { requireUserId } = await import("../auth.server");
    const { ensureIndexes, getDb } = await import("../db.server");

    await ensureIndexes();
    const userId = await requireUserId();
    const db = await getDb();

    await db.collection("quotes").updateOne(
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

export const deleteQuote = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { requireUserId } = await import("../auth.server");
    const { ensureIndexes, getDb } = await import("../db.server");

    await ensureIndexes();
    const userId = await requireUserId();
    const db = await getDb();
    await db.collection("quotes").deleteOne({ userId, id: data.id });
    return { success: true };
  });

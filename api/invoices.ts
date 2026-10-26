import { z } from "zod";

import {
  apiHandler,
  json,
  methodNotAllowed,
  readJson,
  sessionContext,
} from "../src/lib/api/http.server";
import { requireUserId } from "../src/lib/auth.server";
import { ensureIndexes, getDb } from "../src/lib/db.server";
import { savedInvoiceSchema } from "../src/lib/schemas";

export default apiHandler(async (request, response) => {
  if (!["GET", "POST", "DELETE"].includes(request.method ?? "")) {
    methodNotAllowed(response, ["GET", "POST", "DELETE"]);
    return;
  }

  await ensureIndexes();
  const userId = await requireUserId(sessionContext(request, response));
  const db = await getDb();

  if (request.method === "GET") {
    const invoices = await db
      .collection("invoices")
      .find({ userId })
      .sort({ savedAt: -1 })
      .toArray();
    json(
      response,
      200,
      invoices.map((invoice) => ({
        id: invoice.id as string,
        invoiceNo: invoice.invoiceNo as string,
        date: invoice.date as string,
        email: invoice.email as string,
        cell: invoice.cell as string,
        billToName: invoice.billToName as string,
        billToPhone: invoice.billToPhone as string,
        billToAddress: invoice.billToAddress as string,
        items: invoice.items as Array<{
          id: string;
          description: string;
          qty: number;
          unitPrice: number;
        }>,
        terms: invoice.terms as string,
        total: invoice.total as number,
        savedAt: invoice.savedAt as string,
      })),
    );
    return;
  }

  if (request.method === "POST") {
    const data = await readJson(request, savedInvoiceSchema);
    await db.collection("invoices").updateOne(
      { userId, id: data.id },
      {
        $set: { userId, ...data, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    json(response, 200, { success: true });
    return;
  }

  if (request.method === "DELETE") {
    const { id } = await readJson(request, z.object({ id: z.string() }));
    await db.collection("invoices").deleteOne({ userId, id });
    json(response, 200, { success: true });
    return;
  }
});

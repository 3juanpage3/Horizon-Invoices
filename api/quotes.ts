import { z } from "zod";

import {
  apiHandler,
  json,
  methodNotAllowed,
  readJson,
  sessionContext,
} from "../src/lib/api/http.server.js";
import { requireUserId } from "../src/lib/auth.server.js";
import { ensureIndexes, getDb } from "../src/lib/db.server.js";
import { savedQuoteSchema } from "../src/lib/schemas.js";

export default apiHandler(async (request, response) => {
  if (!["GET", "POST", "DELETE"].includes(request.method ?? "")) {
    methodNotAllowed(response, ["GET", "POST", "DELETE"]);
    return;
  }

  await ensureIndexes();
  const userId = await requireUserId(sessionContext(request, response));
  const db = await getDb();

  if (request.method === "GET") {
    const quotes = await db.collection("quotes").find({ userId }).sort({ savedAt: -1 }).toArray();
    json(
      response,
      200,
      quotes.map((quote) => ({
        id: quote.id as string,
        quoteNo: quote.quoteNo as string,
        date: quote.date as string,
        email: quote.email as string,
        cell: quote.cell as string,
        billToName: quote.billToName as string,
        billToPhone: quote.billToPhone as string,
        billToAddress: quote.billToAddress as string,
        items: quote.items as Array<{
          id: string;
          description: string;
          qty: number;
          unitPrice: number;
        }>,
        terms: quote.terms as string,
        total: quote.total as number,
        savedAt: quote.savedAt as string,
      })),
    );
    return;
  }

  if (request.method === "POST") {
    const data = await readJson(request, savedQuoteSchema);
    await db.collection("quotes").updateOne(
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
    await db.collection("quotes").deleteOne({ userId, id });
    json(response, 200, { success: true });
    return;
  }
});

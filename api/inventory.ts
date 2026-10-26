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
import { inventoryItemSchema } from "../src/lib/schemas.js";

export default apiHandler(async (request, response) => {
  if (!["GET", "PUT"].includes(request.method ?? "")) {
    methodNotAllowed(response, ["GET", "PUT"]);
    return;
  }

  await ensureIndexes();
  const userId = await requireUserId(sessionContext(request, response));
  const db = await getDb();

  if (request.method === "GET") {
    const items = await db.collection("inventory").find({ userId }).sort({ name: 1 }).toArray();
    json(
      response,
      200,
      items.map((item) => ({
        id: item.id as string,
        name: item.name as string,
        description: item.description as string,
        unitPrice: item.unitPrice as number,
      })),
    );
    return;
  }

  if (request.method === "PUT") {
    const { items } = await readJson(request, z.object({ items: z.array(inventoryItemSchema) }));
    await db.collection("inventory").deleteMany({ userId });
    if (items.length > 0) {
      await db
        .collection("inventory")
        .insertMany(items.map((item) => ({ userId, ...item, updatedAt: new Date() })));
    }
    json(response, 200, { success: true });
    return;
  }
});

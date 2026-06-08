import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireUserId } from "../auth.server";
import { ensureIndexes, getDb } from "../db.server";
import { inventoryItemSchema } from "../schemas";

export const listInventory = createServerFn({ method: "GET" }).handler(async () => {
  await ensureIndexes();
  const userId = await requireUserId();
  const db = await getDb();
  const items = await db
    .collection("inventory")
    .find({ userId })
    .sort({ name: 1 })
    .toArray();

  return items.map((item) => ({
    id: item.id as string,
    name: item.name as string,
    description: item.description as string,
    unitPrice: item.unitPrice as number,
  }));
});

export const saveInventoryItems = createServerFn({ method: "POST" })
  .inputValidator(z.object({ items: z.array(inventoryItemSchema) }))
  .handler(async ({ data }) => {
    await ensureIndexes();
    const userId = await requireUserId();
    const db = await getDb();

    await db.collection("inventory").deleteMany({ userId });

    if (data.items.length > 0) {
      await db.collection("inventory").insertMany(
        data.items.map((item) => ({
          userId,
          ...item,
          updatedAt: new Date(),
        })),
      );
    }

    return { success: true };
  });

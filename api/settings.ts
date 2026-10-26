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
import { DEFAULT_SETTINGS } from "../src/lib/settings";
import { companySettingsSchema } from "../src/lib/schemas";

const settingsActionSchema = z.object({
  action: z.enum(["create", "update"]),
  data: companySettingsSchema,
});

export default apiHandler(async (request, response) => {
  if (!["GET", "POST"].includes(request.method ?? "")) {
    methodNotAllowed(response, ["GET", "POST"]);
    return;
  }

  await ensureIndexes();
  const userId = await requireUserId(sessionContext(request, response));
  const db = await getDb();

  if (request.method === "GET") {
    const company = await db.collection("companies").findOne({ userId });
    if (!company) {
      json(response, 200, { ...DEFAULT_SETTINGS, onboardingComplete: false });
      return;
    }

    json(response, 200, {
      companyName: (company.companyName as string) ?? "",
      contactPerson: (company.contactPerson as string) ?? "",
      email: (company.email as string) ?? "",
      phone: (company.phone as string) ?? "",
      address: (company.address as string) ?? "",
      city: (company.city as string) ?? "",
      postalCode: (company.postalCode as string) ?? "",
      country: (company.country as string) ?? "",
      website: (company.website as string) ?? "",
      vatNumber: (company.vatNumber as string) ?? "",
      businessRegistration: (company.businessRegistration as string) ?? "",
      bankDetails: (company.bankDetails as string) ?? "",
      logo: company.logo as string | undefined,
      defaultTerms:
        "defaultTerms" in company
          ? ((company.defaultTerms as string) ?? "")
          : DEFAULT_SETTINGS.defaultTerms,
      defaultLineItemDescription:
        "defaultLineItemDescription" in company
          ? ((company.defaultLineItemDescription as string) ?? "")
          : DEFAULT_SETTINGS.defaultLineItemDescription,
      defaultLineItemQty:
        "defaultLineItemQty" in company
          ? ((company.defaultLineItemQty as number) ?? 1)
          : DEFAULT_SETTINGS.defaultLineItemQty,
      defaultLineItemUnitPrice:
        "defaultLineItemUnitPrice" in company
          ? ((company.defaultLineItemUnitPrice as number) ?? 0)
          : DEFAULT_SETTINGS.defaultLineItemUnitPrice,
      onboardingComplete: !!company.onboardingComplete,
    });
    return;
  }

  const { action, data } = await readJson(request, settingsActionSchema);
  if (action === "create") {
    const existing = await db.collection("companies").findOne({ userId });
    if (existing?.onboardingComplete) {
      throw new Error("Company profile already exists");
    }
  }

  await db.collection("companies").updateOne(
    { userId },
    {
      $set: { ...data, userId, onboardingComplete: true, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  json(response, 200, { success: true });
});

import { createServerFn } from "@tanstack/react-start";

import { DEFAULT_SETTINGS } from "../settings";
import { companySettingsSchema } from "../schemas";

export const getCompanySettings = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUserId } = await import("../auth.server");
  const { ensureIndexes, getDb } = await import("../db.server");

  await ensureIndexes();
  const userId = await requireUserId();
  const db = await getDb();
  const company = await db.collection("companies").findOne({ userId });

  if (!company) {
    return { ...DEFAULT_SETTINGS, onboardingComplete: false };
  }

  return {
    companyName: (company.companyName as string) ?? "",
    contactPerson: (company.contactPerson as string) ?? "",
    email: (company.email as string) ?? "",
    phone: (company.phone as string) ?? "",
    address: (company.address as string) ?? "",
    city: (company.city as string) ?? "",
    postalCode: (company.postalCode as string) ?? "",
    country: (company.country as string) ?? "",
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
  };
});

export const createCompany = createServerFn({ method: "POST" })
  .inputValidator(companySettingsSchema)
  .handler(async ({ data }) => {
    const { requireUserId } = await import("../auth.server");
    const { ensureIndexes, getDb } = await import("../db.server");

    await ensureIndexes();
    const userId = await requireUserId();
    const db = await getDb();

    const existing = await db.collection("companies").findOne({ userId });
    if (existing?.onboardingComplete) {
      throw new Error("Company profile already exists");
    }

    await db.collection("companies").updateOne(
      { userId },
      {
        $set: {
          ...data,
          userId,
          onboardingComplete: true,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    return { success: true };
  });

export const updateCompanySettings = createServerFn({ method: "POST" })
  .inputValidator(companySettingsSchema)
  .handler(async ({ data }) => {
    const { requireUserId } = await import("../auth.server");
    const { ensureIndexes, getDb } = await import("../db.server");

    await ensureIndexes();
    const userId = await requireUserId();
    const db = await getDb();

    await db.collection("companies").updateOne(
      { userId },
      {
        $set: {
          ...data,
          userId,
          onboardingComplete: true,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    return { success: true };
  });

import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "../auth.server";
import { ensureIndexes, getDb } from "../db.server";
import { companySettingsSchema } from "../schemas";

const DEFAULT_SETTINGS = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  vatNumber: "",
  businessRegistration: "",
  bankDetails: "",
  logo: undefined as string | undefined,
};

export const getCompanySettings = createServerFn({ method: "GET" }).handler(async () => {
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
    onboardingComplete: !!company.onboardingComplete,
  };
});

export const createCompany = createServerFn({ method: "POST" })
  .inputValidator(companySettingsSchema)
  .handler(async ({ data }) => {
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

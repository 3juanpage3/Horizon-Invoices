import type { CompanySettings } from "../settings";
import { apiRequest } from "./client";

export type CompanySettingsResponse = CompanySettings & { onboardingComplete: boolean };

export const getCompanySettings = () => apiRequest<CompanySettingsResponse>("/api/settings");

export const createCompany = ({ data }: { data: CompanySettings }) =>
  apiRequest<{ success: boolean }>("/api/settings", {
    method: "POST",
    body: JSON.stringify({ action: "create", data }),
  });

export const updateCompanySettings = ({ data }: { data: CompanySettings }) =>
  apiRequest<{ success: boolean }>("/api/settings", {
    method: "POST",
    body: JSON.stringify({ action: "update", data }),
  });

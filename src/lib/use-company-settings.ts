import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getCompanySettings, updateCompanySettings } from "@/lib/api/settings.functions";
import { DEFAULT_SETTINGS, type CompanySettings } from "@/lib/settings";

export function useCompanySettings() {
  const queryClient = useQueryClient();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localSettings, setLocalSettings] = useState<CompanySettings | null>(null);

  const query = useQuery({
    queryKey: ["companySettings"],
    queryFn: () => getCompanySettings(),
  });

  useEffect(() => {
    if (query.data) {
      setLocalSettings({
        companyName: query.data.companyName,
        contactPerson: query.data.contactPerson,
        email: query.data.email,
        phone: query.data.phone,
        address: query.data.address,
        city: query.data.city,
        postalCode: query.data.postalCode,
        country: query.data.country,
        website: query.data.website,  
        vatNumber: query.data.vatNumber,
        businessRegistration: query.data.businessRegistration,
        bankDetails: query.data.bankDetails,
        logo: query.data.logo,
        defaultTerms: query.data.defaultTerms,
        defaultLineItemDescription: query.data.defaultLineItemDescription,
        defaultLineItemQty: query.data.defaultLineItemQty,
        defaultLineItemUnitPrice: query.data.defaultLineItemUnitPrice,
      });
    }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (settings: CompanySettings) => updateCompanySettings({ data: settings }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companySettings"] }),
  });

  const settings = localSettings ?? DEFAULT_SETTINGS;

  const setSettings = (next: CompanySettings) => {
    setLocalSettings(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => mutation.mutate(next), 600);
  };

  return {
    settings,
    setSettings,
    loaded: query.isFetched,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
  };
}

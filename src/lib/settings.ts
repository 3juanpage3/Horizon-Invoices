export type CompanySettings = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  vatNumber: string;
  businessRegistration: string;
  bankDetails?: string;
  logo?: string;
  defaultTerms: string;
  defaultLineItemDescription: string;
  defaultLineItemQty: number;
  defaultLineItemUnitPrice: number;
};

export type DefaultLineItem = {
  description: string;
  qty: number;
  unitPrice: number;
};

export type AuthUser = {
  id: string;
  username: string;
  email: string;
};

const DEFAULT_TERMS_LINES = [
  "The client has read this and understands the conditions from {companyName}",
];

export const DEFAULT_SETTINGS: CompanySettings = {
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
  logo: undefined,
  defaultTerms: DEFAULT_TERMS_LINES.join("\n"),
  defaultLineItemDescription: " (Item description)",
  defaultLineItemQty: 1,
  defaultLineItemUnitPrice: 275,
};

export function getDefaultLineItems(settings: CompanySettings): DefaultLineItem[] {
  const description = settings.defaultLineItemDescription.trim();
  if (!description) {
    return [{ description: "", qty: 1, unitPrice: 0 }];
  }

  return [
    {
      description,
      qty: settings.defaultLineItemQty > 0 ? settings.defaultLineItemQty : 1,
      unitPrice: settings.defaultLineItemUnitPrice,
    },
  ];
}

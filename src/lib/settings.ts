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
};

export type AuthUser = {
  id: string;
  username: string;
  email: string;
};

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
};

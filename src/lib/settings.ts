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
  "K & H Jumping Castles will not be responsible for any loss or injury when our equipment are being used.",
  "The use of our equipment is at your own risk. If stolen or damaged the client will be held responsible for the replacement of the item unless mutually agreed to by both parties.",
  "There most always be an adult present and supervising the children.",
  "No children may come near the motor.",
  "No food or drinks on the inflatable.",
  "Make sure no one wears shoes or any sharp objects.",
  "Setting up the equipment in a flat clean area with no sharp objects on the ground preferarbly on grass.",
  "K & H Jumping Castles does not accept any responsibility for weather conditions.",
  "In case of rain deflate the item and fold it in half to keep the water from getting in.",
  "If the motor got wet and is damaged it's the clients responsibility to replace it.",
  "K & H Jumping Castles will not be responsible for the supplying of the extension cord to the motor.",
  "Be aware of your pets that can damage the inflatable.",
  "Please do not spray or play with paint near the inflatable!!! Most of them does not come off!!!!",
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
  defaultLineItemDescription: "3-in-1 Jumping Castle (3.75x7 meters, 25th & 26th Dec 2025)",
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

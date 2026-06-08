import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanySettings } from "@/lib/use-company-settings";
import { Upload, Trash2 } from "lucide-react";

export function SettingsTab() {
  const { settings, setSettings, isSaving } = useCompanySettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof typeof settings, value: string | number) => {
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSettings({
          ...settings,
          logo: base64,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setSettings({
      ...settings,
      logo: undefined,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
            <CardDescription>Enter your company information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={settings.contactPerson}
                  onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                  placeholder="Contact person name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="company@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Enter your business address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={settings.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={settings.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  placeholder="00000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={settings.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax & Registration</CardTitle>
            <CardDescription>Enter your tax and registration details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vatNumber">VAT Number</Label>
                <Input
                  id="vatNumber"
                  value={settings.vatNumber}
                  onChange={(e) => handleInputChange("vatNumber", e.target.value)}
                  placeholder="VAT/Tax ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessRegistration">Business Registration</Label>
                <Input
                  id="businessRegistration"
                  value={settings.businessRegistration}
                  onChange={(e) => handleInputChange("businessRegistration", e.target.value)}
                  placeholder="Registration Number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankDetails">Bank Details</Label>
              <Textarea
                id="bankDetails"
                value={settings.bankDetails || ""}
                onChange={(e) => handleInputChange("bankDetails", e.target.value)}
                placeholder="Bank name, account number, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
            <CardDescription>Upload and manage your company logo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.logo && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Logo:</p>
                <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                  <img src={settings.logo} alt="Company Logo" className="max-h-32 max-w-full" />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Logo
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 w-full"
              >
                <Upload className="w-4 h-4" />
                {settings.logo ? "Change Logo" : "Upload Logo"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Supported formats: PNG, JPG, GIF (Max 2MB)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4">
          <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
            {isSaving
              ? "Saving to your account..."
              : "Settings are saved to your account and sync across devices."}
          </p>
        </div>
      </div>
    </div>
  );
}

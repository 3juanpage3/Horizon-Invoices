import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Trash2 } from "lucide-react";
import { createCompany } from "@/lib/api/settings.functions";
import { loadSession } from "@/lib/load-session";
import { DEFAULT_SETTINGS, type CompanySettings } from "@/lib/settings";
import { useAuth } from "@/lib/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/setup")({
  loader: async () => {
    const session = await loadSession();
    if (!session.user) throw redirect({ to: "/login" });
    if (session.hasCompany) throw redirect({ to: "/" });
    return session;
  },
  head: () => ({
    meta: [{ title: "Set Up Company - Horizon Invoices" }],
  }),
  component: Setup,
});

function Setup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CompanySettings>({
    ...DEFAULT_SETTINGS,
    email: user?.email ?? "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof CompanySettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((prev) => ({ ...prev, logo: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.companyName.trim()) {
      setError("Company name is required");
      return;
    }

    setSubmitting(true);
    try {
      await createCompany({ data: form });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await queryClient.invalidateQueries({ queryKey: ["companySettings"] });
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save company profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to Horizon Invoices</h1>
          <p className="mt-2 text-muted-foreground">
            Set up your company profile to get started. This is saved to your account and syncs
            across devices.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Basic information shown on your invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="Your Company Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={form.contactPerson}
                    onChange={(e) => update("contactPerson", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(e) => update("postalCode", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax & Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    value={form.vatNumber}
                    onChange={(e) => update("vatNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessRegistration">Business Registration</Label>
                  <Input
                    id="businessRegistration"
                    value={form.businessRegistration}
                    onChange={(e) => update("businessRegistration", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankDetails">Bank Details</Label>
                <Textarea
                  id="bankDetails"
                  rows={3}
                  value={form.bankDetails || ""}
                  onChange={(e) => update("bankDetails", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.logo ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center rounded-lg border bg-gray-50 p-4">
                    <img src={form.logo} alt="Logo preview" className="max-h-32 max-w-full" />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, logo: undefined }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Logo
                  </Button>
                </div>
              ) : null}
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
                <Upload className="h-4 w-4" />
                {form.logo ? "Change Logo" : "Upload Logo"}
              </Button>
            </CardContent>
          </Card>

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Complete Setup & Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}

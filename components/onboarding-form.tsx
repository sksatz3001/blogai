"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyWebsite: "",
    authorName: "",
  });

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.authorName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to complete onboarding");

      toast.success("Onboarding completed successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Company Information</CardTitle>
          <CardDescription className="text-muted-foreground">
            Tell us about your company and brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="Acme Inc."
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              className="bg-white border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Company Website</Label>
            <Input
              id="companyWebsite"
              type="url"
              placeholder="https://acme.com"
              value={formData.companyWebsite}
              onChange={(e) =>
                setFormData({ ...formData, companyWebsite: e.target.value })
              }
              className="bg-white border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authorName">
              Author Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="authorName"
              placeholder="John Doe"
              value={formData.authorName}
              onChange={(e) =>
                setFormData({ ...formData, authorName: e.target.value })
              }
              className="bg-white border-border"
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!formData.companyName || !formData.authorName || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Setup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

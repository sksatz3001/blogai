"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import HexColorPicker to avoid SSR issues
const HexColorPicker = dynamic(
  () => import("react-colorful").then((mod) => mod.HexColorPicker),
  { 
    ssr: false,
    loading: () => <div className="w-full h-48 bg-muted rounded-lg animate-pulse" />
  }
);

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    companyWebsite: "",
    authorName: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6",
    accentColor: "#06b6d4",
  });

  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

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
          <CardTitle className="text-foreground">
            {step === 1 ? "Company Information" : "Brand Colors"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 1
              ? "Tell us about your company and brand"
              : "Choose your brand colors for personalized content"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <>
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
                onClick={() => setStep(2)}
                className="w-full"
                disabled={!formData.companyName || !formData.authorName}
              >
                Next Step
              </Button>
            </>
          ) : (
            <>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-3 items-center">
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: formData.primaryColor }}
                      onClick={() => setShowColorPicker("primary")}
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      className="bg-white border-border"
                    />
                  </div>
                  {showColorPicker === "primary" && (
                    <div className="mt-2">
                      <Suspense fallback={<div className="w-full h-48 bg-muted rounded-lg animate-pulse" />}>
                        <HexColorPicker
                          color={formData.primaryColor}
                          onChange={(color) =>
                            setFormData({ ...formData, primaryColor: color })
                          }
                        />
                      </Suspense>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-3 items-center">
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: formData.secondaryColor }}
                      onClick={() => setShowColorPicker("secondary")}
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, secondaryColor: e.target.value })
                      }
                      className="bg-white border-border"
                    />
                  </div>
                  {showColorPicker === "secondary" && (
                    <div className="mt-2">
                      <Suspense fallback={<div className="w-full h-48 bg-muted rounded-lg animate-pulse" />}>
                        <HexColorPicker
                          color={formData.secondaryColor}
                          onChange={(color) =>
                            setFormData({ ...formData, secondaryColor: color })
                          }
                        />
                      </Suspense>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-3 items-center">
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: formData.accentColor }}
                      onClick={() => setShowColorPicker("accent")}
                    />
                    <Input
                      value={formData.accentColor}
                      onChange={(e) =>
                        setFormData({ ...formData, accentColor: e.target.value })
                      }
                      className="bg-white border-border"
                    />
                  </div>
                  {showColorPicker === "accent" && (
                    <div className="mt-2">
                      <Suspense fallback={<div className="w-full h-48 bg-muted rounded-lg animate-pulse" />}>
                        <HexColorPicker
                          color={formData.accentColor}
                          onChange={(color) =>
                            setFormData({ ...formData, accentColor: color })
                          }
                        />
                      </Suspense>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Setup
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2">
        <div
          className={`h-2 w-16 rounded-full transition-colors ${
            step >= 1 ? "bg-primary" : "bg-muted"
          }`}
        />
        <div
          className={`h-2 w-16 rounded-full transition-colors ${
            step >= 2 ? "bg-primary" : "bg-muted"
          }`}
        />
      </div>
    </div>
  );
}

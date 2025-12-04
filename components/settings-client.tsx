"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Building2, 
  Globe, 
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Briefcase,
  FileText
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserSettings {
  email: string;
  authorName: string;
  companyName: string;
  companyWebsite: string;
  companyDescription: string;
}

interface CompanyProfile {
  id: number;
  companyName: string;
  companyWebsite: string | null;
  description: string | null;
}

interface SettingsClientProps {
  user: UserSettings;
  companyProfiles: CompanyProfile[];
}

export function SettingsClient({ user, companyProfiles }: SettingsClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");
  const [showNewProfileForm, setShowNewProfileForm] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    authorName: user.authorName,
    companyName: user.companyName,
    companyWebsite: user.companyWebsite,
    companyDescription: user.companyDescription,
  });

  const [newProfile, setNewProfile] = useState({
    companyName: "",
    companyWebsite: "",
    description: "",
  });

  const [fetchingDescription, setFetchingDescription] = useState(false);
  const [fetchingProfileDescription, setFetchingProfileDescription] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
    setError("");
  };

  const fetchCompanyDescription = async (website: string, isProfile: boolean = false) => {
    if (!website.trim()) return;

    if (isProfile) {
      setFetchingProfileDescription(true);
    } else {
      setFetchingDescription(true);
    }

    try {
      const response = await fetch("/api/company-details/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch company details");
      }

      const { description } = await response.json();

      if (isProfile) {
        setNewProfile(prev => ({ ...prev, description }));
      } else {
        setFormData(prev => ({ ...prev, companyDescription: description }));
      }
    } catch (err) {
      setError("Failed to fetch company details. Please enter manually.");
    } finally {
      if (isProfile) {
        setFetchingProfileDescription(false);
      } else {
        setFetchingDescription(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: formData.authorName,
          companyName: formData.companyName,
          companyWebsite: formData.companyWebsite,
          companyDescription: formData.companyDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      setIsSaved(true);
      router.refresh();
      
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfile.companyName.trim()) {
      setError("Company name is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/company-profiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: newProfile.companyName,
          companyWebsite: newProfile.companyWebsite,
          description: newProfile.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create profile");
      }

      setIsSaved(true);
      setShowNewProfileForm(false);
      setNewProfile({
        companyName: "",
        companyWebsite: "",
        description: "",
      });
      router.refresh();
      
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError("Failed to create profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    if (!confirm("Are you sure you want to delete this company profile?")) {
      return;
    }

    try {
      const response = await fetch(`/api/company-profiles/${profileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete profile");
      }

      router.refresh();
    } catch (err) {
      setError("Failed to delete profile. Please try again.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Success/Error Messages */}
      {isSaved && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="text-primary font-medium">Settings saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-destructive font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Information */}
        <Card className="glass border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">Account Information</CardTitle>
                <CardDescription>Your personal details and contact information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-card/50 border-border text-foreground cursor-not-allowed"
                />
                <Badge 
                  variant="outline" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 border-primary/30 text-primary text-xs"
                >
                  Verified
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            {/* Author Name */}
            <div className="space-y-2">
              <Label htmlFor="authorName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Author Name
              </Label>
              <Input
                id="authorName"
                type="text"
                value={formData.authorName}
                onChange={(e) => handleChange("authorName", e.target.value)}
                placeholder="Enter your name"
                className="bg-card/50 border-border focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                This name will appear as the author on your blogs
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card className="glass border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/5">
                <Building2 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">Company Information</CardTitle>
                <CardDescription>Business details and branding</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-secondary" />
                Company Name
              </Label>
              <Input
                id="companyName"
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="Enter your company name"
                className="bg-card/50 border-border focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                Your business or organization name
              </p>
            </div>

            {/* Company Website */}
            <div className="space-y-2">
              <Label htmlFor="companyWebsite" className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-secondary" />
                Company Website
              </Label>
              <div className="flex gap-2">
                <Input
                  id="companyWebsite"
                  type="url"
                  value={formData.companyWebsite}
                  onChange={(e) => handleChange("companyWebsite", e.target.value)}
                  placeholder="https://example.com"
                  className="bg-card/50 border-border focus-visible:ring-2 focus-visible:ring-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchCompanyDescription(formData.companyWebsite, false)}
                  disabled={!formData.companyWebsite || fetchingDescription}
                  className="whitespace-nowrap"
                >
                  {fetchingDescription ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Auto-fill
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your company&apos;s website URL
              </p>
            </div>

            {/* Company Description */}
            <div className="space-y-2">
              <Label htmlFor="companyDescription" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary" />
                Company Description
              </Label>
              <textarea
                id="companyDescription"
                value={formData.companyDescription}
                onChange={(e) => handleChange("companyDescription", e.target.value)}
                placeholder="Brief description of your company..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-card/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
              />
              <p className="text-xs text-muted-foreground">
                A brief description of what your company does
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="gap-2 min-w-[200px]"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Company Profiles Section */}
      <Card className="glass border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5">
                <Briefcase className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">Company Profiles</CardTitle>
                <CardDescription>Manage multiple client companies for your agency</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowNewProfileForm(!showNewProfileForm)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New Profile Form */}
          {showNewProfileForm && (
            <div className="p-6 rounded-xl bg-card/30 border border-border space-y-4">
              <h3 className="text-lg font-semibold text-foreground">New Company Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={newProfile.companyName}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Client Company Name"
                    className="bg-card/50 border-border focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newProfile.companyWebsite}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, companyWebsite: e.target.value }))}
                      placeholder="https://client.com"
                      className="bg-card/50 border-border focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCompanyDescription(newProfile.companyWebsite, true)}
                      disabled={!newProfile.companyWebsite || fetchingProfileDescription}
                      className="whitespace-nowrap"
                    >
                      {fetchingProfileDescription ? (
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={newProfile.description}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the company (auto-filled from website)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-card/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewProfileForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateProfile}
                  disabled={isLoading}
                >
                  Create Profile
                </Button>
              </div>
            </div>
          )}

          {/* Existing Profiles */}
          {companyProfiles.length === 0 && !showNewProfileForm ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-accent/30 mx-auto mb-3" />
              <p className="text-foreground mb-2">No company profiles yet</p>
              <p className="text-sm text-muted-foreground">Create profiles for your client companies</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companyProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-4 rounded-xl bg-card/30 border border-border hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{profile.companyName}</h4>
                      {profile.companyWebsite && (
                        <a
                          href={profile.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          {profile.companyWebsite}
                        </a>
                      )}
                      {profile.description && (
                        <p className="text-sm text-muted-foreground mt-2">{profile.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteProfile(profile.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

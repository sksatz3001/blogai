"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogIn, User, Lock, AlertCircle } from "lucide-react";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/employee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Redirect to employee dashboard
      router.push("/employee/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1E222A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="glass border-2 border-[#3B4252]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-[#88C0D0] to-[#8FBCBB] flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-[#ECEFF4]">
              Employee Login
            </CardTitle>
            <p className="text-[#D8DEE9]/70 text-sm mt-2">
              Sign in with your employee credentials
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[#BF616A]/10 border border-[#BF616A] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#BF616A]" />
                  <span className="text-sm text-[#BF616A]">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#88C0D0]" />
                  Username
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Enter your username"
                  required
                  className="bg-[#2E3440]/50 border-[#3B4252] focus:border-[#88C0D0]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#88C0D0]" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  required
                  className="bg-[#2E3440]/50 border-[#3B4252] focus:border-[#88C0D0]"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] hover:opacity-90"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>

              <div className="text-center pt-4">
                <p className="text-xs text-[#D8DEE9]/60">
                  Contact your administrator if you have login issues
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a
            href="/sign-in"
            className="text-sm text-[#88C0D0] hover:text-[#8FBCBB] transition-colors"
          >
            Company Admin Login →
          </a>
        </div>
      </div>
    </div>
  );
}

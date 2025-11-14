"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Settings,
  LogOut,
  BarChart3,
  Shield,
  Lock,
} from "lucide-react";

interface EmployeeProps {
  employee: {
    id: number;
    username: string;
    fullName: string;
    email: string | null;
  };
}

interface PermissionData {
  permissions: string[];
}

export default function EmployeeDashboardClient({ employee }: EmployeeProps) {
  const router = useRouter();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/employee/verify");
      if (response.ok) {
        const data: PermissionData = await response.json();
        setPermissions(data.permissions);
      }
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/employee/logout", { method: "POST" });
      router.push("/employee/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const hasPermission = (perm: string) => permissions.includes(perm);

  const navigationItems = [
    {
      title: "View Blogs",
      icon: FileText,
      href: "/employee/blogs",
      permission: "view_blogs",
    },
    {
      title: "Create Blog",
      icon: PlusCircle,
      href: "/employee/create",
      permission: "create_blog",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      href: "/employee/analytics",
      permission: "view_analytics",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/employee/settings",
      permission: "manage_settings",
    },
  ];

  return (
    <div className="min-h-screen bg-[#1E222A] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#ECEFF4]">
              Welcome, {employee.fullName}
            </h1>
            <p className="text-[#D8DEE9]/70 mt-2">@{employee.username}</p>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-[#BF616A] text-[#BF616A] hover:bg-[#BF616A]/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Permission Notice */}
        {permissions.length === 0 && !loading && (
          <Card className="glass border-2 border-[#D08770] bg-[#D08770]/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-[#D08770]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#D08770]">
                    No Permissions Assigned
                  </h3>
                  <p className="text-[#D8DEE9]/70 text-sm mt-1">
                    Contact your administrator to get access to features
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const allowed = hasPermission(item.permission);

            return (
              <Card
                key={item.title}
                className={`glass border-2 ${
                  allowed
                    ? "border-[#3B4252] hover:border-[#88C0D0]/50 cursor-pointer"
                    : "border-[#3B4252] opacity-50 cursor-not-allowed"
                } transition-all`}
                onClick={() => allowed && router.push(item.href)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-[#ECEFF4]">
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-[#88C0D0]" />
                      {item.title}
                    </div>
                    {!allowed && <Lock className="h-5 w-5 text-[#BF616A]" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#D8DEE9]/70">
                    {allowed
                      ? "Click to access"
                      : "Permission required - contact admin"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Permissions List */}
        <Card className="glass border-2 border-[#3B4252]">
          <CardHeader>
            <CardTitle className="text-[#ECEFF4] flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#88C0D0]" />
              Your Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-[#D8DEE9]/60">Loading permissions...</p>
            ) : permissions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-3 py-1 rounded-full bg-[#88C0D0]/20 text-[#88C0D0] text-sm border border-[#88C0D0]"
                  >
                    {perm.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[#D8DEE9]/60">No permissions assigned</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

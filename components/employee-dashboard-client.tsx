"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {employee.fullName}
          </h1>
          <p className="text-muted-foreground mt-1">@{employee.username}</p>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Permission Notice */}
      {permissions.length === 0 && !loading && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="text-lg font-semibold text-orange-700">
                  No Permissions Assigned
                </h3>
                <p className="text-orange-600/80 text-sm mt-1">
                  Contact your administrator to get access to features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const allowed = hasPermission(item.permission);

          return (
            <Card
              key={item.title}
              className={`transition-all ${
                allowed
                  ? "hover:border-primary/30 cursor-pointer hover:shadow-sm"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => allowed && router.push(item.href)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {item.title}
                  </div>
                  {!allowed && <Lock className="h-4 w-4 text-red-400" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            Your Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading permissions...</p>
          ) : permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {permissions.map((perm) => (
                <Badge
                  key={perm}
                  variant="outline"
                  className="bg-primary/5 text-primary border-primary/20"
                >
                  {perm.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No permissions assigned</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

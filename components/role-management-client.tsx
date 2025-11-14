"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lock,
  User,
} from "lucide-react";

interface Role {
  id: number;
  name: string;
  description: string | null;
}

interface Permission {
  id: number;
  name: string;
  description: string | null;
  category: string;
}

interface RolePermission {
  roleId: number;
  permissionId: number;
}

export default function RoleManagementClient() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchRolePermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/admin/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  const fetchPermissions = async () => {
    try {
      console.log("Fetching permissions...");
      const response = await fetch("/api/admin/permissions");
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Permissions loaded:", data);
        if (data.permissions && Array.isArray(data.permissions)) {
          setPermissions(data.permissions);
          console.log("Set permissions state:", data.permissions.length, "permissions");
        } else {
          console.error("Invalid permissions data format:", data);
          setError("Invalid permissions data received");
        }
      } else {
        console.log("Permissions endpoint returned error, status:", response.status);
        const errorData = await response.json().catch(() => ({}));
        console.log("Error data:", errorData);
        
        // Try to seed permissions
        console.log("Attempting to seed permissions...");
        const seedResponse = await fetch("/api/admin/permissions", {
          method: "POST",
        });
        console.log("Seed response status:", seedResponse.status);
        
        if (seedResponse.ok) {
          console.log("Permissions seeded successfully, fetching again...");
          // Fetch again after seeding
          const retryResponse = await fetch("/api/admin/permissions");
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            console.log("Permissions after seeding:", data);
            if (data.permissions && Array.isArray(data.permissions)) {
              setPermissions(data.permissions);
            }
          } else {
            const retryError = await retryResponse.json().catch(() => ({}));
            console.error("Retry fetch failed:", retryError);
            setError("Failed to load permissions after seeding");
          }
        } else {
          const seedError = await seedResponse.json().catch(() => ({}));
          console.error("Seeding failed:", seedError);
          setError("Failed to seed permissions");
        }
      }
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
      setError(`Failed to load permissions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const response = await fetch("/api/admin/role-permissions");
      if (response.ok) {
        const data = await response.json();
        setRolePermissions(data.rolePermissions);
      }
    } catch (err) {
      console.error("Failed to fetch role permissions:", err);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create role");
      }

      // Assign permissions to the role
      if (selectedPermissions.length > 0) {
        await fetch("/api/admin/role-permissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roleId: data.role.id,
            permissionIds: selectedPermissions,
          }),
        });
      }

      setSuccess("Role created successfully!");
      setNewRole({ name: "", description: "" });
      setSelectedPermissions([]);
      setShowNewRoleForm(false);
      fetchRoles();
      fetchRolePermissions();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      const response = await fetch(`/api/admin/roles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete role");
      }

      setSuccess("Role deleted successfully!");
      fetchRoles();
      fetchRolePermissions();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const getRolePermissions = (roleId: number): number[] => {
    return rolePermissions
      .filter((rp) => rp.roleId === roleId)
      .map((rp) => rp.permissionId);
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="min-h-screen bg-[#1E222A] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#ECEFF4] flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#88C0D0]" />
              Role Management
            </h1>
            <p className="text-[#D8DEE9]/70 mt-2">
              Create roles and assign permissions
            </p>
          </div>

          <Button
            onClick={() => setShowNewRoleForm(!showNewRoleForm)}
            className="bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>

        {/* Notifications */}
        {success && (
          <div className="glass p-4 rounded-xl border-2 border-[#A3BE8C] bg-[#A3BE8C]/10 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#A3BE8C]" />
            <span className="text-[#A3BE8C]">{success}</span>
          </div>
        )}

        {error && (
          <div className="glass p-4 rounded-xl border-2 border-[#BF616A] bg-[#BF616A]/10 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-[#BF616A]" />
            <span className="text-[#BF616A]">{error}</span>
          </div>
        )}

        {/* New Role Form */}
        {showNewRoleForm && (
          <Card className="glass border-2 border-[#3B4252]">
            <CardHeader>
              <CardTitle className="text-[#ECEFF4] flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#88C0D0]" />
                Create New Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRole} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Role Name *</Label>
                    <Input
                      id="name"
                      value={newRole.name}
                      onChange={(e) =>
                        setNewRole({ ...newRole, name: e.target.value })
                      }
                      placeholder="Content Writer"
                      required
                      className="bg-[#2E3440]/50 border-[#3B4252]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newRole.description}
                      onChange={(e) =>
                        setNewRole({ ...newRole, description: e.target.value })
                      }
                      placeholder="Creates and edits blog content"
                      className="bg-[#2E3440]/50 border-[#3B4252]"
                    />
                  </div>
                </div>

                {/* Permissions Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg">Assign Permissions</Label>
                    <span className="text-xs text-[#D8DEE9]/60">
                      {permissions.length} permissions available
                    </span>
                  </div>
                  
                  {permissions.length === 0 ? (
                    <div className="p-6 rounded-lg bg-[#2E3440]/30 border-2 border-[#3B4252]">
                      <p className="text-[#D8DEE9]/60 text-center">Loading permissions...</p>
                      <p className="text-xs text-[#D8DEE9]/40 mt-2 text-center">
                        If this persists, check browser console (F12) for errors
                      </p>
                      <Button
                        type="button"
                        onClick={() => {
                          console.log("Manually reloading permissions...");
                          fetchPermissions();
                        }}
                        variant="outline"
                        className="mt-4 mx-auto block"
                      >
                        Retry Loading Permissions
                      </Button>
                    </div>
                  ) : (
                    Object.entries(groupedPermissions).map(([category, perms]) => (
                      <div key={category} className="space-y-2">
                        <h3 className="text-sm font-semibold text-[#88C0D0] uppercase">
                          {category}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {perms.map((perm) => (
                            <div
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedPermissions.includes(perm.id)
                                  ? "bg-[#88C0D0]/20 border-[#88C0D0]"
                                  : "bg-[#2E3440]/30 border-[#3B4252] hover:border-[#88C0D0]/50"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center ${
                                    selectedPermissions.includes(perm.id)
                                      ? "bg-[#88C0D0] border-[#88C0D0]"
                                      : "border-[#4C566A]"
                                  }`}
                                >
                                  {selectedPermissions.includes(perm.id) && (
                                    <CheckCircle2 className="h-3 w-3 text-[#2E3440]" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-[#ECEFF4]">
                                    {perm.name.replace(/_/g, " ")}
                                  </p>
                                  {perm.description && (
                                    <p className="text-xs text-[#D8DEE9]/60 mt-1">
                                      {perm.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Role"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewRoleForm(false);
                      setSelectedPermissions([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Roles List */}
        <Card className="glass border-2 border-[#3B4252]">
          <CardHeader>
            <CardTitle className="text-[#ECEFF4] flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#88C0D0]" />
              Roles ({roles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-[#4C566A] mx-auto mb-4" />
                <p className="text-[#D8DEE9]/60">No roles yet</p>
                <p className="text-sm text-[#D8DEE9]/40 mt-2">
                  Create your first role to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {roles.map((role) => {
                  const assignedPermissions = getRolePermissions(role.id);
                  return (
                    <div
                      key={role.id}
                      className="p-4 rounded-xl bg-[#2E3440]/30 border-2 border-[#3B4252] hover:border-[#88C0D0]/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div>
                            <h3 className="text-lg font-semibold text-[#ECEFF4]">
                              {role.name}
                            </h3>
                            {role.description && (
                              <p className="text-sm text-[#D8DEE9]/70 mt-1">
                                {role.description}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-[#88C0D0] uppercase">
                              Permissions ({assignedPermissions.length})
                            </p>
                            {assignedPermissions.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {assignedPermissions.map((permId) => {
                                  const perm = permissions.find((p) => p.id === permId);
                                  return perm ? (
                                    <Badge
                                      key={permId}
                                      variant="outline"
                                      className="bg-[#88C0D0]/10 text-[#88C0D0] border-[#88C0D0] font-semibold"
                                    >
                                      {perm.name.replace(/_/g, " ")}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-[#D8DEE9]/40">
                                No permissions assigned
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-[#BF616A] hover:bg-[#BF616A]/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Access */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/team")}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-2" />
            Manage Employees
          </Button>
        </div>
      </div>
    </div>
  );
}

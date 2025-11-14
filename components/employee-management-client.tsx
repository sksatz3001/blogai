"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  Calendar,
  Activity,
} from "lucide-react";

interface Employee {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  roleId: number | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
}

export default function EmployeeManagementClient() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showNewEmployeeForm, setShowNewEmployeeForm] = useState(false);
  const [showPasswordFor, setShowPasswordFor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [newEmployee, setNewEmployee] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    roleId: "",
  });

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    roleId: "",
    isActive: true,
    newPassword: "",
  });

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  const fetchEmployees = async () => {
    try {
      console.log("Fetching employees...");
      const response = await fetch("/api/admin/employees");
      console.log("Employees fetch response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Employees data received:", data);
        setEmployees(data.employees);
        console.log("Employees state updated, count:", data.employees.length);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch employees:", errorData);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

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

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Creating employee with data:", {
        ...newEmployee,
        roleId: newEmployee.roleId ? parseInt(newEmployee.roleId) : null,
      });

      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEmployee,
          roleId: newEmployee.roleId ? parseInt(newEmployee.roleId) : null,
        }),
      });

      const data = await response.json();
      console.log("Employee creation response:", data);

      if (!response.ok) {
        console.error("Employee creation failed:", data);
        throw new Error(data.error || "Failed to create employee");
      }

      setSuccess("Employee created successfully!");
      setNewEmployee({
        username: "",
        password: "",
        fullName: "",
        email: "",
        roleId: "",
      });
      setShowNewEmployeeForm(false);
      
      // Refresh the employee list
      console.log("Fetching updated employee list...");
      await fetchEmployees();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error creating employee:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/employees/${editingEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          roleId: editForm.roleId ? parseInt(editForm.roleId) : null,
          password: editForm.newPassword || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update employee");
      }

      setSuccess("Employee updated successfully!");
      setEditingEmployee(null);
      fetchEmployees();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      const response = await fetch(`/api/admin/employees/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete employee");
      }

      setSuccess("Employee deleted successfully!");
      fetchEmployees();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      fullName: employee.fullName,
      email: employee.email || "",
      roleId: employee.roleId?.toString() || "",
      isActive: employee.isActive,
      newPassword: "",
    });
  };

  const getRoleName = (roleId: number | null) => {
    if (!roleId) return "No Role";
    const role = roles.find((r) => r.id === roleId);
    return role?.name || "Unknown";
  };

  return (
    <div className="min-h-screen bg-[#1E222A] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#ECEFF4] flex items-center gap-3">
              <Users className="h-8 w-8 text-[#88C0D0]" />
              Team Management
            </h1>
            <p className="text-[#D8DEE9]/70 mt-2">
              Manage employees, roles, and permissions
            </p>
          </div>

          <Button
            onClick={() => setShowNewEmployeeForm(!showNewEmployeeForm)}
            className="bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
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

        {/* New Employee Form */}
        {showNewEmployeeForm && (
          <Card className="glass border-2 border-[#3B4252]">
            <CardHeader>
              <CardTitle className="text-[#ECEFF4] flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#88C0D0]" />
                Create New Employee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={newEmployee.username}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, username: e.target.value })
                      }
                      placeholder="employee123"
                      required
                      className="bg-[#2E3440]/50 border-[#3B4252]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newEmployee.password}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, password: e.target.value })
                      }
                      placeholder="••••••••"
                      required
                      className="bg-[#2E3440]/50 border-[#3B4252]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={newEmployee.fullName}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, fullName: e.target.value })
                      }
                      placeholder="John Doe"
                      required
                      className="bg-[#2E3440]/50 border-[#3B4252]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, email: e.target.value })
                      }
                      placeholder="john@example.com"
                      className="bg-[#2E3440]/50 border-[#3B4252]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roleId">Role</Label>
                    <select
                      id="roleId"
                      value={newEmployee.roleId}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, roleId: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-[#2E3440]/50 border-2 border-[#3B4252] text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
                    >
                      <option value="">No Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Employee"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewEmployeeForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Employees List */}
        <Card className="glass border-2 border-[#3B4252]">
          <CardHeader>
            <CardTitle className="text-[#ECEFF4] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#88C0D0]" />
              Employees ({employees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-[#4C566A] mx-auto mb-4" />
                <p className="text-[#D8DEE9]/60">No employees yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="p-4 rounded-xl bg-[#2E3440]/30 border-2 border-[#3B4252] hover:border-[#88C0D0]/50 transition-all"
                  >
                    {editingEmployee?.id === employee.id ? (
                      <form onSubmit={handleUpdateEmployee} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                              value={editForm.fullName}
                              onChange={(e) =>
                                setEditForm({ ...editForm, fullName: e.target.value })
                              }
                              className="bg-[#2E3440]/50 border-[#3B4252]"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm({ ...editForm, email: e.target.value })
                              }
                              className="bg-[#2E3440]/50 border-[#3B4252]"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Role</Label>
                            <select
                              value={editForm.roleId}
                              onChange={(e) =>
                                setEditForm({ ...editForm, roleId: e.target.value })
                              }
                              className="w-full px-4 py-3 rounded-lg bg-[#2E3440]/50 border-2 border-[#3B4252] text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
                            >
                              <option value="">No Role</option>
                              {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label>New Password (leave blank to keep current)</Label>
                            <Input
                              type="password"
                              value={editForm.newPassword}
                              onChange={(e) =>
                                setEditForm({ ...editForm, newPassword: e.target.value })
                              }
                              placeholder="••••••••"
                              className="bg-[#2E3440]/50 border-[#3B4252]"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`active-${employee.id}`}
                              checked={editForm.isActive}
                              onChange={(e) =>
                                setEditForm({ ...editForm, isActive: e.target.checked })
                              }
                              className="rounded"
                            />
                            <Label htmlFor={`active-${employee.id}`}>Active</Label>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button type="submit" size="sm" disabled={loading}>
                            Save Changes
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingEmployee(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-[#ECEFF4]">
                              {employee.fullName}
                            </h3>
                            {employee.isActive ? (
                              <Badge variant="outline" className="bg-[#A3BE8C]/10 text-[#A3BE8C] border-[#A3BE8C] font-semibold">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-[#BF616A]/10 text-[#BF616A] border-[#BF616A] font-semibold">
                                Inactive
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-[#D8DEE9]/70">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {employee.username}
                            </div>
                            {employee.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {employee.email}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              {getRoleName(employee.roleId)}
                            </div>
                            {employee.lastLogin && (
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Last login: {new Date(employee.lastLogin).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-[#BF616A] hover:bg-[#BF616A]/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

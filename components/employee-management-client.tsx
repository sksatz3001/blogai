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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage employees, roles, and permissions
          </p>
        </div>

        <Button onClick={() => setShowNewEmployeeForm(!showNewEmployeeForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-lg border border-green-200 bg-green-50 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* New Employee Form */}
      {showNewEmployeeForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
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
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
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
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Employees ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No employees yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-all"
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
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Role</Label>
                          <select
                            value={editForm.roleId}
                            onChange={(e) =>
                              setEditForm({ ...editForm, roleId: e.target.value })
                            }
                            className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
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
                          <h3 className="text-base font-semibold text-foreground">
                            {employee.fullName}
                          </h3>
                          {employee.isActive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Inactive
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                          className="text-red-600 hover:bg-red-50 border-red-200"
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
  );
}

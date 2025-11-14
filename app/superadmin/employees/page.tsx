"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmployeeRow {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  roleId: number | null;
  isActive: boolean | null;
  createdAt: string | null;
}

export default function SuperAdminEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/superadmin/employees');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setEmployees(data.employees || []);
    } catch (e:any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: number, isActive: boolean | null) => {
    await fetch(`/api/superadmin/employees/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !isActive }) });
    load();
  };
  const remove = async (id: number) => {
    if (!confirm('Delete employee?')) return;
    await fetch(`/api/superadmin/employees/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Employees</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">ID</th>
                    <th className="p-2">Username</th>
                    <th className="p-2">Full Name</th>
                    <th className="p-2">Owner (User)</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Active</th>
                    <th className="p-2">Created</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(e => (
                    <tr key={e.id} className="border-t">
                      <td className="p-2">{e.id}</td>
                      <td className="p-2">{e.username}</td>
                      <td className="p-2">{e.fullName}</td>
                      <td className="p-2">{e.userId}</td>
                      <td className="p-2">{e.roleId ?? '-'}</td>
                      <td className="p-2">{e.isActive ? 'Yes' : 'No'}</td>
                      <td className="p-2">{e.createdAt?.toString().slice(0, 10)}</td>
                      <td className="p-2 flex gap-2">
                        <Button size="sm" onClick={() => toggleActive(e.id, e.isActive)}>Toggle Active</Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(e.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

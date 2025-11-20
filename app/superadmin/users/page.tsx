"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserRow {
  id: number;
  email: string;
  companyName: string | null;
  onboardingCompleted: boolean | null;
  createdAt: string | null;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/superadmin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setUsers(data.users || []);
    } catch (e:any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    if (!confirm('Delete user?')) return;
    await fetch(`/api/superadmin/users/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Users</h2>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="text-left">
                    <th className="p-2">ID</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Company</th>
                    <th className="p-2">Onboarded</th>
                    <th className="p-2">Created</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="p-2">{u.id}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.companyName || '-'}</td>
                      <td className="p-2">{u.onboardingCompleted ? 'Yes' : 'No'}</td>
                      <td className="p-2">{u.createdAt?.toString().slice(0, 10)}</td>
                      <td className="p-2 flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => remove(u.id)}>Delete</Button>
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

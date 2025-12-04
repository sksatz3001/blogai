"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { Coins, Trash2, Loader2 } from "lucide-react";

interface UserRow {
  id: number;
  email: string;
  companyName: string | null;
  onboardingCompleted: boolean | null;
  credits: number | null;
  totalCreditsUsed: number | null;
  createdAt: string | null;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

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
    if (!confirm('Delete user and all their data (blogs, employees, etc.)? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/superadmin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete user');
      } else {
        toast.success('User deleted successfully');
        load();
      }
    } catch (e) {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Users</h2>
        <Link href="/superadmin/credits">
          <Button variant="outline" className="gap-2">
            <Coins className="h-4 w-4" />
            Manage Credits
          </Button>
        </Link>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="text-left border-b border-border">
                    <th className="p-3">ID</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Credits</th>
                    <th className="p-3">Onboarded</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/50">
                      <td className="p-3 font-medium">{u.id}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.companyName || '-'}</td>
                      <td className="p-3">
                        <Badge variant={(u.credits || 0) < 50 ? "destructive" : "secondary"} className="gap-1">
                          <Coins className="h-3 w-3" />
                          {(u.credits || 0).toFixed(1)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={u.onboardingCompleted ? "default" : "outline"}>
                          {u.onboardingCompleted ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{u.createdAt?.toString().slice(0, 10)}</td>
                      <td className="p-3">
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => remove(u.id)}
                          disabled={deleting === u.id}
                          className="gap-1"
                        >
                          {deleting === u.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Delete
                        </Button>
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

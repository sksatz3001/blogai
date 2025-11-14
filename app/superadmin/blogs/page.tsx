"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BlogRow {
  id: number;
  title: string;
  status: string | null;
  userId: number;
  employeeId: number | null;
  createdAt: string | null;
}

export default function SuperAdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/superadmin/blogs');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setBlogs(data.blogs || []);
    } catch (e:any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const publish = async (id: number) => {
    await fetch(`/api/superadmin/blogs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'published', publishedAt: new Date().toISOString() }) });
    load();
  };
  const unpublish = async (id: number) => {
    await fetch(`/api/superadmin/blogs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'draft', publishedAt: null }) });
    load();
  };
  const remove = async (id: number) => {
    if (!confirm('Delete blog?')) return;
    await fetch(`/api/superadmin/blogs/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Blogs</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Blogs</CardTitle>
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
                    <th className="p-2">Title</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Owner (User)</th>
                    <th className="p-2">Employee</th>
                    <th className="p-2">Created</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map(b => (
                    <tr key={b.id} className="border-t">
                      <td className="p-2">{b.id}</td>
                      <td className="p-2">{b.title}</td>
                      <td className="p-2">{b.status}</td>
                      <td className="p-2">{b.userId}</td>
                      <td className="p-2">{b.employeeId ?? '-'}</td>
                      <td className="p-2">{b.createdAt?.toString().slice(0, 10)}</td>
                      <td className="p-2 flex gap-2">
                        <Button size="sm" onClick={() => publish(b.id)}>Publish</Button>
                        <Button size="sm" variant="outline" onClick={() => unpublish(b.id)}>Unpublish</Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(b.id)}>Delete</Button>
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

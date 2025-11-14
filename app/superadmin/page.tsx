import { db } from "@/db";
export const dynamic = "force-dynamic";
import { blogs, employees, users, employeeActivity } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon, UserCheck, FileText, CheckCircle, Activity, BarChart3 } from "lucide-react";

export default async function SuperAdminDashboardPage() {
  // Core counts
  const [usersCount, employeesCount, blogsCount, publishedCount, activeEmployees] = await Promise.all([
    db.select({ c: count() }).from(users),
    db.select({ c: count() }).from(employees),
    db.select({ c: count() }).from(blogs),
    db.select({ c: count() }).from(blogs).where(eq(blogs.status, 'published')),
    db.select({ c: count() }).from(employees).where(eq(employees.isActive, true)),
  ]);
  const uc = usersCount?.[0]?.c || 0;
  const ec = employeesCount?.[0]?.c || 0;
  const bc = blogsCount?.[0]?.c || 0;
  const pc = publishedCount?.[0]?.c || 0;
  const ac = activeEmployees?.[0]?.c || 0;

  // Blog metrics and recent activity
  const blogMetrics = await db.select({ id: blogs.id, status: blogs.status, seoScore: blogs.seoScore, createdAt: blogs.createdAt }).from(blogs);
  const activities = await db.select().from(employeeActivity).orderBy(desc(employeeActivity.createdAt)).limit(8);

  const avgSEO = (() => {
    const scores = blogMetrics.map(b => b.seoScore).filter((v): v is number => typeof v === 'number');
    if (!scores.length) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  })();

  const weekCount = (() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return blogMetrics.filter(b => {
      const t = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return t >= sevenDaysAgo;
    }).length;
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and control the entire SaaS at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/superadmin/users" className="text-primary">Users</Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/superadmin/employees" className="text-primary">Employees</Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/superadmin/blogs" className="text-primary">Blogs</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-[#1B2332] to-[#0E1626] border-[#1F2A3A]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[#E6EDF3]">
              <UsersIcon className="h-5 w-5 text-[#88C0D0]" /> Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#E6EDF3]">{uc}</div>
            <p className="text-xs text-[#9DA7BA] mt-1">Total registered companies</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1B2332] to-[#0E1626] border-[#1F2A3A]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[#E6EDF3]">
              <UserCheck className="h-5 w-5 text-[#A3BE8C]" /> Active Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#E6EDF3]">{ac}</div>
            <p className="text-xs text-[#9DA7BA] mt-1">Currently active accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1B2332] to-[#0E1626] border-[#1F2A3A]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[#E6EDF3]">
              <FileText className="h-5 w-5 text-[#81A1C1]" /> Blogs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#E6EDF3]">{bc}</div>
            <p className="text-xs text-[#9DA7BA] mt-1">Total blog posts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1B2332] to-[#0E1626] border-[#1F2A3A]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[#E6EDF3]">
              <CheckCircle className="h-5 w-5 text-[#D08770]" /> Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#E6EDF3]">{pc}</div>
            <p className="text-xs text-[#9DA7BA] mt-1">Live public posts</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SEO & Content Health */}
        <Card className="lg:col-span-1 bg-[#0E1626] border-[#1F2A3A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#88C0D0]" /> Content Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-6">
              <div>
                <div className="text-3xl font-bold">{avgSEO}</div>
                <p className="text-xs text-muted-foreground">Avg. SEO Score</p>
              </div>
              <div>
                <div className="text-3xl font-bold">{weekCount}</div>
                <p className="text-xs text-muted-foreground">New last 7 days</p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-[#1B2332]">
              <div className="h-2 rounded-full bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB]" style={{ width: `${Math.min(100, avgSEO)}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-1 bg-[#0E1626] border-[#1F2A3A]">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/superadmin/users" className="rounded-xl border border-[#1F2A3A] p-3 hover:bg-[#1B2332] transition">
                <div className="text-sm">Manage Users</div>
                <div className="text-xs text-muted-foreground">View, edit, delete</div>
              </Link>
              <Link href="/superadmin/employees" className="rounded-xl border border-[#1F2A3A] p-3 hover:bg-[#1B2332] transition">
                <div className="text-sm">Manage Employees</div>
                <div className="text-xs text-muted-foreground">Toggle active, delete</div>
              </Link>
              <Link href="/superadmin/blogs" className="rounded-xl border border-[#1F2A3A] p-3 hover:bg-[#1B2332] transition">
                <div className="text-sm">Manage Blogs</div>
                <div className="text-xs text-muted-foreground">Publish, unpublish, delete</div>
              </Link>
              <Link href="/dashboard" className="rounded-xl border border-[#1F2A3A] p-3 hover:bg-[#1B2332] transition">
                <div className="text-sm">Admin Area</div>
                <div className="text-xs text-muted-foreground">Go to main dashboard</div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1 bg-[#0E1626] border-[#1F2A3A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-[#A3BE8C]" /> Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
              {activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-[#1F2A3A] p-3">
                  <div>
                    <div className="text-sm font-medium">{a.activityType}</div>
                    {a.metadata ? (
                      <div className="text-xs text-muted-foreground">{String(JSON.stringify(a.metadata)).slice(0, 80)}{String(JSON.stringify(a.metadata)).length > 80 ? '…' : ''}</div>
                    ) : null}
                  </div>
                  <Badge variant="secondary" className="text-xs">{a.createdAt?.toString().slice(0, 16)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { db } from "@/db";
export const dynamic = "force-dynamic";
import { blogs, employees, users, employeeActivity, creditTransactions } from "@/db/schema";
import { count, eq, desc, sql, gte } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users as UsersIcon, 
  UserCheck, 
  FileText, 
  CheckCircle, 
  Activity, 
  BarChart3,
  Coins,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Settings,
  Shield,
  Zap,
  Globe,
  Image,
  Wand2,
  ArrowUpRight,
  RefreshCcw,
  MessageSquareCode
} from "lucide-react";

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

  // Credit statistics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalCreditsResult, creditsUsedResult, creditUsageByType] = await Promise.all([
    db.select({ total: sql<number>`COALESCE(SUM(${users.credits}), 0)` }).from(users),
    db.select({ total: sql<number>`COALESCE(SUM(${users.totalCreditsUsed}), 0)` }).from(users),
    db
      .select({
        type: creditTransactions.type,
        totalAmount: sql<number>`SUM(ABS(${creditTransactions.amount}))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(creditTransactions)
      .where(sql`${creditTransactions.amount} < 0`)
      .groupBy(creditTransactions.type),
  ]);

  const totalCreditsAvailable = totalCreditsResult?.[0]?.total || 0;
  const totalCreditsUsed = creditsUsedResult?.[0]?.total || 0;

  // Get users with low credits (< 50)
  const lowCreditUsers = await db
    .select({
      id: users.id,
      email: users.email,
      companyName: users.companyName,
      credits: users.credits,
    })
    .from(users)
    .where(sql`${users.credits} < 50`)
    .orderBy(users.credits)
    .limit(5);

  // Blog metrics and recent activity
  const blogMetrics = await db.select({ id: blogs.id, status: blogs.status, seoScore: blogs.seoScore, createdAt: blogs.createdAt }).from(blogs);
  const activities = await db.select().from(employeeActivity).orderBy(desc(employeeActivity.createdAt)).limit(5);

  // Recent credit transactions
  const recentCreditTransactions = await db
    .select({
      id: creditTransactions.id,
      amount: creditTransactions.amount,
      type: creditTransactions.type,
      description: creditTransactions.description,
      createdAt: creditTransactions.createdAt,
      userEmail: users.email,
      companyName: users.companyName,
    })
    .from(creditTransactions)
    .leftJoin(users, eq(creditTransactions.userId, users.id))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(8);

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

  // Credit usage breakdown
  const blogCredits = creditUsageByType.find(c => c.type === 'blog_generation');
  const imageCredits = creditUsageByType.find(c => c.type === 'image_generation');
  const editCredits = creditUsageByType.find(c => c.type === 'image_edit');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Complete control center for your SaaS platform</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/superadmin/prompts">
            <Button variant="outline" className="gap-2">
              <MessageSquareCode className="h-4 w-4" />
              Prompts
            </Button>
          </Link>
          <Link href="/superadmin/users">
            <Button variant="outline" className="gap-2">
              <UsersIcon className="h-4 w-4" />
              Users
            </Button>
          </Link>
          <Link href="/superadmin/credits">
            <Button className="gap-2">
              <Coins className="h-4 w-4" />
              Manage Credits
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-4xl font-bold text-blue-600">{uc}</p>
                <p className="text-xs text-muted-foreground mt-1">Registered companies</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <UsersIcon className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Employees</p>
                <p className="text-4xl font-bold text-green-600">{ac}</p>
                <p className="text-xs text-muted-foreground mt-1">Currently active</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <UserCheck className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Blogs</p>
                <p className="text-4xl font-bold text-purple-600">{bc}</p>
                <p className="text-xs text-muted-foreground mt-1">{pc} published</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <FileText className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credits in System</p>
                <p className="text-4xl font-bold text-amber-600">{totalCreditsAvailable.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{totalCreditsUsed.toFixed(0)} used total</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Coins className="h-7 w-7 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Usage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Credit Usage by Type
            </CardTitle>
            <CardDescription>How credits are being consumed across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Blog Generation <span className="font-normal text-xs">(text only)</span></p>
                    <p className="text-xs text-muted-foreground">10 credits each</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {blogCredits?.totalAmount?.toFixed(1) || '0'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {blogCredits?.count || 0} blogs generated
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Image className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Image Generation</p>
                    <p className="text-xs text-muted-foreground">1 credit each</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {imageCredits?.totalAmount?.toFixed(1) || '0'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {imageCredits?.count || 0} images generated
                </p>
              </div>

              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <Wand2 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">AI Image Edit</p>
                    <p className="text-xs text-muted-foreground">2 credits each</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  {editCredits?.totalAmount?.toFixed(1) || '0'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {editCredits?.count || 0} edits made
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Needing Credits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Low Credit Users
            </CardTitle>
            <CardDescription>Users with less than 50 credits</CardDescription>
          </CardHeader>
          <CardContent>
            {lowCreditUsers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
                <p>All users have sufficient credits!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowCreditUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{user.companyName || user.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant="destructive" className="ml-2">
                      {(user.credits || 0).toFixed(1)}
                    </Badge>
                  </div>
                ))}
                <Link href="/superadmin/credits" className="block">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Coins className="h-4 w-4" />
                    Add Credits
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Content Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/superadmin/users" className="block">
                <div className="rounded-xl border border-border p-4 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer group">
                  <UsersIcon className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Manage Users</p>
                  <p className="text-xs text-muted-foreground">View & edit accounts</p>
                </div>
              </Link>
              <Link href="/superadmin/credits" className="block">
                <div className="rounded-xl border border-border p-4 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer group">
                  <CreditCard className="h-5 w-5 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Credits</p>
                  <p className="text-xs text-muted-foreground">Add/remove credits</p>
                </div>
              </Link>
              <Link href="/superadmin/blogs" className="block">
                <div className="rounded-xl border border-border p-4 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer group">
                  <FileText className="h-5 w-5 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Blogs</p>
                  <p className="text-xs text-muted-foreground">Manage content</p>
                </div>
              </Link>
              <Link href="/superadmin/employees" className="block">
                <div className="rounded-xl border border-border p-4 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer group">
                  <Shield className="h-5 w-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Employees</p>
                  <p className="text-xs text-muted-foreground">Team access</p>
                </div>
              </Link>
              <Link href="/superadmin/prompts" className="block col-span-2">
                <div className="rounded-xl border border-border p-4 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer group">
                  <MessageSquareCode className="h-5 w-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">System Prompts</p>
                  <p className="text-xs text-muted-foreground">Edit AI blog & image prompts</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* SEO & Content Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              Content Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Average SEO Score</span>
                  <span className="text-2xl font-bold text-primary">{avgSEO}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all" 
                    style={{ width: `${Math.min(100, avgSEO)}%` }} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{weekCount}</p>
                  <p className="text-xs text-muted-foreground">New this week</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{pc}</p>
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Credit Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCreditTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
              ) : (
                recentCreditTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {tx.companyName || tx.userEmail}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{tx.type?.replace('_', ' ')}</p>
                    </div>
                    <Badge 
                      variant={tx.amount && tx.amount > 0 ? "default" : "secondary"}
                      className={tx.amount && tx.amount > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                    >
                      {tx.amount && tx.amount > 0 ? '+' : ''}{tx.amount?.toFixed(2)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-primary" />
            Recent Employee Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {activities.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-4">No recent activity</p>
            )}
            {activities.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize">{a.activityType?.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.createdAt?.toLocaleDateString()}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

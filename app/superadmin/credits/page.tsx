"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  Search,
  Plus,
  Minus,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

interface UserWithCredits {
  id: number;
  email: string;
  companyName: string | null;
  authorName: string | null;
  credits: number;
  totalCreditsUsed: number;
  createdAt: string;
  recentTransactions: Transaction[];
}

export default function SuperAdminCreditsPage() {
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithCredits | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/superadmin/credits");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async (isDeduct: boolean = false) => {
    if (!selectedUser || !creditAmount) {
      toast.error("Please select a user and enter an amount");
      return;
    }

    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/superadmin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: isDeduct ? -amount : amount,
          note: creditNote,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setCreditAmount("");
        setCreditNote("");
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update credits");
      }
    } catch (error) {
      console.error("Failed to update credits:", error);
      toast.error("Failed to update credits");
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.companyName?.toLowerCase().includes(query) ||
      user.authorName?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const totalCreditsInSystem = users.reduce((sum, u) => sum + (u.credits || 0), 0);
  const totalCreditsUsed = users.reduce((sum, u) => sum + (u.totalCreditsUsed || 0), 0);
  const lowCreditUsers = users.filter(u => (u.credits || 0) < 50).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/superadmin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Coins className="h-8 w-8 text-amber-500" />
              Credit Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Add or remove credits for users across the platform
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Coins className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCreditsInSystem.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Credits Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCreditsUsed.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Credits Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowCreditUsers}</p>
                <p className="text-sm text-muted-foreground">Low Credit Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Select a user to manage their credits</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, company, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedUser?.id === user.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {user.companyName || user.authorName || "Unnamed"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge 
                          variant={(user.credits || 0) < 50 ? "destructive" : "secondary"}
                          className="text-sm"
                        >
                          {(user.credits || 0).toFixed(1)} credits
                        </Badge>
                        {selectedUser?.id === user.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Used: {(user.totalCreditsUsed || 0).toFixed(1)}</span>
                      <span>•</span>
                      <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Actions Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              Manage Credits
            </CardTitle>
            <CardDescription>
              {selectedUser 
                ? `Managing credits for ${selectedUser.companyName || selectedUser.email}`
                : "Select a user from the list"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-6">
                {/* Selected User Info */}
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Selected User</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="font-medium">{selectedUser.companyName || selectedUser.authorName}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {(selectedUser.credits || 0).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-muted-foreground">
                        {(selectedUser.totalCreditsUsed || 0).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Used</p>
                    </div>
                  </div>
                </div>

                {/* Credit Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="creditAmount">Credit Amount</Label>
                  <Input
                    id="creditAmount"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Enter amount..."
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                  />
                </div>

                {/* Note Input */}
                <div className="space-y-2">
                  <Label htmlFor="creditNote">Note (optional)</Label>
                  <Input
                    id="creditNote"
                    placeholder="Reason for credit change..."
                    value={creditNote}
                    onChange={(e) => setCreditNote(e.target.value)}
                  />
                </div>

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 250, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setCreditAmount(amount.toString())}
                    >
                      +{amount}
                    </Button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleAddCredits(false)}
                    disabled={processing || !creditAmount}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add Credits
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAddCredits(true)}
                    disabled={processing || !creditAmount}
                    className="gap-2"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                    Deduct
                  </Button>
                </div>

                {/* Recent Transactions */}
                {selectedUser.recentTransactions.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Recent Transactions</p>
                    <div className="space-y-2">
                      {selectedUser.recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground truncate flex-1">
                            {tx.type?.replace('_', ' ')}
                          </span>
                          <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Coins className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a user from the list to manage their credits</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

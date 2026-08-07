"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Calendar,
  Users,
  Percent,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DashboardStats {
  totalCustomers: number;
  activeReservations: number;
  pendingReservations: number;
  totalEquipment: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  equipmentUtilization: number;
}

interface MostRentedItem {
  id?: string;
  equipmentId?: string;
  name?: string;
  equipmentName?: string;
  category?: string;
  categoryName?: string;
  imageUrl?: string;
  totalRentals: number;
  totalRevenue: number;
}

interface TrendItem {
  date: string;
  pending: number;
  approved: number;
  active: number;
  returned: number;
  cancelled: number;
}

interface ActivityLogItem {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.role === "WAREHOUSE") {
      router.replace("/inventory");
    }
  }, [user, router]);

  const [trendPeriod, setTrendPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [rentedPeriod, setRentedPeriod] = useState<"week" | "month" | "quarter">("month");

  // 1. Fetch Overview Stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await apiClient.get("/dashboard/stats");
      return (res.data?.data ?? null) as DashboardStats | null;
    },
  });

  // 2. Fetch Most Rented Equipment
  const { data: mostRented = [], isLoading: isLoadingMostRented } = useQuery({
    queryKey: ["dashboard", "most-rented", rentedPeriod],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/most-rented?period=${rentedPeriod}&limit=5`);
      const items = res.data?.data ?? [];
      return Array.isArray(items) ? (items as MostRentedItem[]) : [];
    },
  });

  // 3. Fetch Reservation Trends
  const { data: trends = [], isLoading: isLoadingTrends } = useQuery({
    queryKey: ["dashboard", "trends", trendPeriod],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/reservation-trends?period=${trendPeriod}`);
      const items = res.data?.data ?? [];
      return Array.isArray(items) ? (items as TrendItem[]) : [];
    },
  });

  // 4. Fetch Recent Activity Logs
  const { data: activityLogs = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ["dashboard", "activity-logs"],
    queryFn: async () => {
      const res = await apiClient.get("/activity-logs?pageSize=6");
      const rawData = res.data?.data;
      const items = Array.isArray(rawData) ? rawData : rawData?.data ?? rawData?.items ?? [];
      return Array.isArray(items) ? (items as ActivityLogItem[]) : [];
    },
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("CREATE") || action.includes("REGISTER") || action.includes("LOGIN"))
      return "success";
    if (action.includes("UPDATE") || action.includes("PAYMENT")) return "info";
    if (action.includes("DELETE") || action.includes("CANCEL")) return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">Dashboard Overview</h1>
          <p className="text-slate-500 text-xs mt-1">
            Real-time analytics, inventory performance, and activity insights
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchStats()}
          className="border-slate-200 text-slate-700 hover:bg-slate-50 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-2 text-slate-500" />
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Revenue */}
        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Revenue
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-7 flex items-center text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs font-medium">
                  {(stats?.revenueGrowth || 0) >= 0 ? (
                    <span className="flex items-center text-emerald-600">
                      <TrendingUp className="h-3.5 w-3.5 mr-0.5" />+{stats?.revenueGrowth}%
                    </span>
                  ) : (
                    <span className="flex items-center text-rose-600">
                      <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                      {stats?.revenueGrowth}%
                    </span>
                  )}
                  <span className="text-slate-400 font-normal">vs last month</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 2. Active Reservations */}
        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Rentals
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-7 flex items-center text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {stats?.activeReservations || 0}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs font-medium text-amber-600">
                  <Clock className="h-3.5 w-3.5 mr-0.5" />
                  <span>{stats?.pendingReservations || 0} pending approval</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 3. Total Customers */}
        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Customers
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-7 flex items-center text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {stats?.totalCustomers || 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Registered rental accounts</div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 4. Fleet Utilization */}
        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fleet Utilization
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Percent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-7 flex items-center text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {stats?.equipmentUtilization || 0}%
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {stats?.totalEquipment || 0} total gear items cataloged
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reservation Trends Chart (2 cols) */}
        <Card className="lg:col-span-2 border-slate-200 bg-white text-slate-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 font-heading">
                Reservation Volume & Status Trends
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs mt-0.5">
                Rental activity broken down by status over time
              </CardDescription>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(["daily", "weekly", "monthly"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors capitalize cursor-pointer ${
                    trendPeriod === period
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingTrends ? (
              <div className="h-72 flex items-center justify-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading trends...
              </div>
            ) : trends.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                No reservation trend data available for this period.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "0.5rem",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="active"
                      name="Active"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorActive)"
                    />
                    <Area
                      type="monotone"
                      dataKey="pending"
                      name="Pending"
                      stroke="#d97706"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPending)"
                    />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      name="Approved"
                      stroke="#059669"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorApproved)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Rented Equipment List (1 col) */}
        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 font-heading">
                Top Rented Gear
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs mt-0.5">
                Highest performing equipment items
              </CardDescription>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(["week", "month", "quarter"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setRentedPeriod(period)}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors capitalize cursor-pointer ${
                    rentedPeriod === period
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingMostRented ? (
              <div className="h-72 flex items-center justify-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading top items...
              </div>
            ) : mostRented.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                No equipment performance data for this period.
              </div>
            ) : (
              <div className="space-y-3">
                {mostRented.map((item, index) => {
                  const itemId = item.equipmentId || item.id || `most-rented-${index}`;
                  const itemName = item.equipmentName || item.name || "Equipment Item";
                  const itemCategory = item.category || item.categoryName || "Category";

                  return (
                    <div
                      key={itemId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                          #{index + 1}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-900 truncate">{itemName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{itemCategory}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-blue-600 block">
                          {item.totalRentals} rentals
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatCurrency(item.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log Feed */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 font-heading">
                Audit & Activity Feed
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Real-time record of system actions and user events
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingActivity ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading activity log...
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No activity recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activityLogs.map((log, index) => (
                <div key={log.id || `log-${index}`} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                      {log.action}
                    </Badge>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {log.user
                          ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})`
                          : "System / Anonymous User"}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize">
                        Entity: {log.entityType ? log.entityType.toLowerCase() : "system"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-[10px] text-slate-500 gap-1 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(log.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

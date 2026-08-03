"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  ArrowUpRight,
  Package,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  id: string;
  name: string;
  categoryName: string;
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
      return res.data.data as DashboardStats;
    },
  });

  // 2. Fetch Most Rented Equipment
  const { data: mostRented = [], isLoading: isLoadingMostRented } = useQuery({
    queryKey: ["dashboard", "most-rented", rentedPeriod],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/most-rented?period=${rentedPeriod}&limit=5`);
      return res.data.data as MostRentedItem[];
    },
  });

  // 3. Fetch Reservation Trends
  const { data: trends = [], isLoading: isLoadingTrends } = useQuery({
    queryKey: ["dashboard", "trends", trendPeriod],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/reservation-trends?period=${trendPeriod}`);
      return res.data.data as TrendItem[];
    },
  });

  // 4. Fetch Recent Activity Logs
  const { data: activityLogs = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ["dashboard", "activity-logs"],
    queryFn: async () => {
      const res = await apiClient.get("/activity-logs?pageSize=6");
      return res.data.data.items as ActivityLogItem[];
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
    <div className="space-y-8 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time analytics, equipment performance, and reservation management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStats()}
            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* 4-Column Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Revenue */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-lg hover:border-slate-700 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white font-heading">
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                ) : (
                  formatCurrency(stats?.totalRevenue || 0)
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {stats && stats.revenueGrowth >= 0 ? (
                  <span className="flex items-center font-medium text-emerald-400">
                    <TrendingUp className="mr-1 h-3.5 w-3.5" /> +{stats.revenueGrowth.toFixed(1)}%
                  </span>
                ) : (
                  <span className="flex items-center font-medium text-rose-400">
                    <TrendingDown className="mr-1 h-3.5 w-3.5" /> {stats?.revenueGrowth.toFixed(1)}%
                  </span>
                )}
                <span className="text-slate-500">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Active Reservations */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-lg hover:border-slate-700 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Rentals
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white font-heading">
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                ) : (
                  stats?.activeReservations || 0
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Badge variant="warning" className="text-[10px] px-2 py-0">
                  {stats?.pendingReservations || 0} Pending Approval
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Customers */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-lg hover:border-slate-700 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Customers
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white font-heading">
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                ) : (
                  stats?.totalCustomers || 0
                )}
              </div>
              <div className="mt-2 text-xs text-slate-500">Registered platform accounts</div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Equipment Utilization */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-lg hover:border-slate-700 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Stock Utilization
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Percent className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white font-heading">
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                ) : (
                  `${(stats?.equipmentUtilization || 0).toFixed(1)}%`
                )}
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats?.equipmentUtilization || 0, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reservation Trends Chart (2 cols) */}
        <Card className="lg:col-span-2 border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-white font-heading">
                Reservation Volume Trends
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-0.5">
                Time-series distribution of rental reservations by status
              </CardDescription>
            </div>
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(["daily", "weekly", "monthly"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize cursor-pointer ${
                    trendPeriod === period
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingTrends ? (
              <div className="h-72 flex items-center justify-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading trends data...
              </div>
            ) : trends.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
                No reservation trend data available for this period.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.5rem",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="active"
                      name="Active"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorActive)"
                    />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      name="Approved"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorApproved)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Rented Equipment Bar Chart / List (1 col) */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-white font-heading">
                Top Rented Gear
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-0.5">
                Highest performing equipment items
              </CardDescription>
            </div>
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(["week", "month", "quarter"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setRentedPeriod(period)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors capitalize cursor-pointer ${
                    rentedPeriod === period
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingMostRented ? (
              <div className="h-72 flex items-center justify-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading top items...
              </div>
            ) : mostRented.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
                No equipment performance data for this period.
              </div>
            ) : (
              <div className="space-y-4">
                {mostRented.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 font-bold text-xs">
                        #{index + 1}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.categoryName}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-blue-400 block">
                        {item.totalRentals} rentals
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatCurrency(item.totalRevenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log Feed */}
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <div>
              <CardTitle className="text-lg font-semibold text-white font-heading">
                Audit & Activity Feed
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Real-time record of system actions and user events
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingActivity ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading activity log...
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No activity recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {activityLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={getActionBadgeVariant(log.action)} className="text-[10px] px-2 py-0.5">
                      {log.action}
                    </Badge>
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-200 truncate">
                        {log.user
                          ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})`
                          : "System / Anonymous User"}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize">
                        Entity: {log.entityType.toLowerCase()}
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

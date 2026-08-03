"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  Search,
  Users,
  Filter,
  Eye,
  Edit,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER" | "WAREHOUSE";
  isActive: boolean;
  createdAt: string;
  _count?: {
    customerReservations: number;
    uploads: number;
  };
}

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "ADMIN";

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Selected user for Detail / Edit Modals
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState<string>("CUSTOMER");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Users List
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", page, debouncedSearch, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (roleFilter) params.append("role", roleFilter);

      const res = await apiClient.get(`/users?${params.toString()}`);
      let data = res.data.data as {
        items: UserItem[];
        meta: {
          total: number;
          page: number;
          pageSize: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      };

      // Client-side filter for active status if specified
      if (statusFilter !== "all") {
        const isActiveBool = statusFilter === "active";
        data.items = data.items.filter((u) => u.isActive === isActiveBool);
      }

      return data;
    },
  });

  // Toggle Active Status Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (userItem: UserItem) => {
      await apiClient.patch(`/users/${userItem.id}`, {
        isActive: !userItem.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (selectedUser) {
        setSelectedUser((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
      }
    },
  });

  // Update Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await apiClient.patch(`/users/${id}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "STAFF":
        return "info";
      case "WAREHOUSE":
        return "warning";
      default:
        return "secondary";
    }
  };

  const items = usersData?.items || [];
  const meta = usersData?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Customer Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage user accounts, roles, access permissions, and activity metrics.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user name or email..."
              className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400 flex-shrink-0 hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full md:w-40 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="STAFF">Staff</option>
              <option value="WAREHOUSE">Warehouse</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 w-full md:w-36 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Data Table */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User Profile</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Reservations</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-40 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-6 w-16 bg-slate-200 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-6 w-16 bg-slate-200 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-8 w-16 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-10 w-10 text-slate-300 mb-2 stroke-1" />
                      <p className="text-sm font-semibold text-slate-700">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((userItem) => {
                  const initials = `${userItem.firstName?.[0] || ""}${
                    userItem.lastName?.[0] || ""
                  }`.toUpperCase() || "U";

                  return (
                    <tr key={userItem.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-600 text-xs font-bold text-white flex items-center justify-center shadow-sm flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <Link
                              href={`/customers/${userItem.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                            >
                              {userItem.firstName} {userItem.lastName}
                            </Link>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-900">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{userItem.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{userItem.phone || "No phone"}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <Badge variant={getRoleBadgeVariant(userItem.role)} className="text-xs">
                          {userItem.role}
                        </Badge>
                      </td>

                      <td className="py-4 px-4 font-semibold text-blue-600 text-xs">
                        {userItem._count?.customerReservations || 0} rentals
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500">
                        {formatDate(userItem.createdAt)}
                      </td>

                      <td className="py-4 px-4">
                        <Badge
                          variant={userItem.isActive ? "success" : "secondary"}
                          className="text-xs cursor-pointer"
                          onClick={() => isAdmin && toggleActiveMutation.mutate(userItem)}
                          title={isAdmin ? "Click to toggle account status" : undefined}
                        >
                          {userItem.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/customers/${userItem.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-slate-900"
                              title="View Customer Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-blue-600"
                              onClick={() => {
                                setEditingUser(userItem);
                                setEditRole(userItem.role);
                              }}
                              title="Edit User Role"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
            <span>
              Page {meta.page} of {meta.totalPages} ({meta.total} users)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Update Role — ${editingUser?.firstName} ${editingUser?.lastName}`}
        description="Modify permission level and system access tier."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">System Access Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="CUSTOMER">CUSTOMER (Standard User)</option>
              <option value="STAFF">STAFF (Reservation Manager)</option>
              <option value="WAREHOUSE">WAREHOUSE (Stock Operator)</option>
              <option value="ADMIN">ADMIN (Full System Control)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() =>
                editingUser &&
                updateRoleMutation.mutate({ id: editingUser.id, role: editRole })
              }
              isLoading={updateRoleMutation.isPending}
            >
              Save Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

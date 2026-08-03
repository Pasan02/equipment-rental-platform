"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  FileText,
  Loader2,
  AlertCircle,
  Package,
  ExternalLink,
} from "lucide-react";

interface CustomerDetail {
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
  customerReservations?: Array<{
    id: string;
    reservationNumber: string;
    status: string;
    pickupDate: string;
    returnDate: string;
    totalAmount: number | string;
    createdAt: string;
  }>;
  uploads?: Array<{
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    createdAt: string;
  }>;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${id}`);
      return res.data.data as CustomerDetail;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      if (!customer) return;
      await apiClient.patch(`/users/${id}`, { isActive: !customer.isActive });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer", id] }),
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Loading customer profile...
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="py-16 text-center text-slate-400 space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Customer Not Found</h2>
        <p className="text-sm text-slate-500">The requested user profile does not exist.</p>
        <Link href="/customers">
          <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-200">
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const initials = `${customer.firstName?.[0] || ""}${customer.lastName?.[0] || ""}`.toUpperCase() || "U";

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "APPROVED":
        return "info";
      case "ACTIVE":
        return "default";
      case "RETURNED":
        return "success";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/customers">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </Button>
        </Link>

        {isAdmin && (
          <Button
            variant={customer.isActive ? "destructive" : "default"}
            size="sm"
            onClick={() => toggleActiveMutation.mutate()}
            isLoading={toggleActiveMutation.isPending}
          >
            {customer.isActive ? "Deactivate Account" : "Activate Account"}
          </Button>
        )}
      </div>

      {/* Profile Overview Card */}
      <Card className="border-slate-800 bg-slate-900/80 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-blue-600 font-bold text-white text-xl flex items-center justify-center shadow-lg shadow-blue-600/25 flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-heading text-white">
                  {customer.firstName} {customer.lastName}
                </h1>
                <Badge variant={getRoleBadgeVariant(customer.role)} className="text-xs">
                  {customer.role}
                </Badge>
                <Badge variant={customer.isActive ? "success" : "secondary"} className="text-xs">
                  {customer.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>{customer.phone || "No phone provided"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Joined {formatDate(customer.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Reservations History & Uploaded Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reservation History (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 font-heading">
              <Calendar className="h-4 w-4 text-blue-400" /> Reservation History
            </h3>
            {!customer.customerReservations || customer.customerReservations.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No reservations made by this customer yet.</p>
            ) : (
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg bg-slate-950 overflow-hidden text-xs">
                {customer.customerReservations.map((res) => (
                  <div key={res.id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/50 transition-colors">
                    <div>
                      <Link
                        href={`/reservations/${res.id}`}
                        className="font-mono font-semibold text-white hover:text-blue-400 transition-colors"
                      >
                        {res.reservationNumber}
                      </Link>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {formatDate(res.pickupDate)} — {formatDate(res.returnDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusBadgeVariant(res.status)} className="text-[10px]">
                        {res.status}
                      </Badge>
                      <span className="font-semibold text-blue-400 font-mono">
                        {formatCurrency(res.totalAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Uploaded Documents (1 col) */}
        <div className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 font-heading">
              <FileText className="h-4 w-4 text-purple-400" /> Verification Documents
            </h3>
            {!customer.uploads || customer.uploads.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No identity/agreement documents uploaded.</p>
            ) : (
              <div className="space-y-2.5">
                {customer.uploads.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="truncate">
                      <p className="font-semibold text-white truncate">{doc.fileName}</p>
                      <p className="text-[10px] text-slate-500">{doc.type}</p>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 p-1.5 cursor-pointer"
                      title="Download document"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

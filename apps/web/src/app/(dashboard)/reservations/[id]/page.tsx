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
import { Modal } from "@/components/ui/modal";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Ban,
  Loader2,
  User,
  Package,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  Download,
} from "lucide-react";

interface ReservationDetail {
  id: string;
  reservationNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "RETURNED" | "CANCELLED";
  pickupDate: string;
  returnDate: string;
  actualReturnDate?: string;
  totalAmount: number | string;
  depositTotal: number | string;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  approvedBy?: {
    firstName: string;
    lastName: string;
  };
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    subtotal: number | string;
    deposit: number | string;
    equipment?: {
      id: string;
      name: string;
      images?: Array<{ imageUrl: string }>;
    };
  }>;
  uploads?: Array<{
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
  }>;
  payments?: Array<{
    id: string;
    transactionId: string;
    amount: number | string;
    type: string;
    status: string;
    paidAt?: string;
  }>;
}

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isStaffOrAdmin = user?.role === "ADMIN" || user?.role === "STAFF";
  const isWarehouse = user?.role === "WAREHOUSE";

  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [returning, setReturning] = useState(false);
  const [returnNotes, setReturnNotes] = useState("");

  const { data: reservation, isLoading, isError } = useQuery({
    queryKey: ["reservation", id],
    queryFn: async () => {
      const res = await apiClient.get(`/reservations/${id}`);
      return res.data.data as ReservationDetail;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch(`/reservations/${id}/approve`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservation", id] }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      await apiClient.patch(`/reservations/${id}/reject`, { rejectionReason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      setRejecting(false);
      setRejectionReason("");
    },
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch(`/reservations/${id}/activate`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservation", id] }),
  });

  const returnMutation = useMutation({
    mutationFn: async (notes: string) => {
      await apiClient.patch(`/reservations/${id}/return`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      setReturning(false);
      setReturnNotes("");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch(`/reservations/${id}/cancel`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservation", id] }),
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Loading reservation details...
      </div>
    );
  }

  if (isError || !reservation) {
    return (
      <div className="py-16 text-center text-slate-400 space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Reservation Not Found</h2>
        <p className="text-sm text-slate-500">The requested reservation record does not exist.</p>
        <Link href="/reservations">
          <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-200">
            Back to Reservations
          </Button>
        </Link>
      </div>
    );
  }

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
      case "REJECTED":
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const steps = [
    { title: "Created", done: true },
    {
      title: "Approved",
      done: ["APPROVED", "ACTIVE", "RETURNED"].includes(reservation.status),
    },
    { title: "Picked Up (Active)", done: ["ACTIVE", "RETURNED"].includes(reservation.status) },
    { title: "Returned", done: reservation.status === "RETURNED" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/reservations">
          <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 gap-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Back to Reservations
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(reservation.status)} className="text-xs px-3 py-1">
            {reservation.status}
          </Badge>
        </div>
      </div>

      {/* Title & Metadata Banner */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 font-mono">Reservation Number</span>
            <h1 className="text-2xl font-extrabold font-heading text-slate-900 font-mono mt-0.5">
              {reservation.reservationNumber}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Created on {formatDateTime(reservation.createdAt)}
            </p>
          </div>
          <div className="text-left md:text-right">
            <span className="text-xs text-slate-500 font-medium block">Rental Duration</span>
            <span className="text-base font-semibold text-blue-600">
              {formatDate(reservation.pickupDate)} — {formatDate(reservation.returnDate)}
            </span>
          </div>
        </div>

        {/* Timeline Progress Step Indicator */}
        {!["REJECTED", "CANCELLED"].includes(reservation.status) && (
          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    step.done ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Main Grid: Customer & Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Financial Info (1 col) */}
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white text-slate-900 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 font-heading">
              <User className="h-4 w-4 text-blue-600" /> Customer Information
            </h3>
            {reservation.customer ? (
              <div className="space-y-2 text-xs text-slate-700">
                <p className="font-bold text-slate-900 text-sm">
                  {reservation.customer.firstName} {reservation.customer.lastName}
                </p>
                <p className="text-slate-500">{reservation.customer.email}</p>
                <p className="text-slate-500">{reservation.customer.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Customer profile unavailable.</p>
            )}
          </Card>

          <Card className="border-slate-200 bg-white text-slate-900 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 font-heading">
              <DollarSign className="h-4 w-4 text-emerald-600" /> Financial Summary
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Rental Total</span>
                <span className="font-semibold text-slate-900">{formatCurrency(reservation.totalAmount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Security Deposit</span>
                <span className="font-semibold text-slate-700">{formatCurrency(reservation.depositTotal)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-slate-900">Grand Total</span>
                <span className="font-bold text-blue-600 text-sm">
                  {formatCurrency(Number(reservation.totalAmount) + Number(reservation.depositTotal))}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Reserved Items & Uploads (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 bg-white text-slate-900 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 font-heading">
              <Package className="h-4 w-4 text-blue-600" /> Reserved Equipment Items
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden text-xs">
              {reservation.items?.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                      {item.equipment?.images?.[0]?.imageUrl ? (
                        <img
                          src={item.equipment.images[0].imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.equipment?.name || "Equipment Item"}</p>
                      <p className="text-slate-500">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-600 block">{formatCurrency(item.subtotal)}</span>
                    <span className="text-[10px] text-slate-500">Dep: {formatCurrency(item.deposit)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Workflow Action Bar */}
          <Card className="border-slate-200 bg-white text-slate-900 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Management Workflow Actions</h3>
            <div className="flex flex-wrap items-center gap-3">
              {reservation.status === "PENDING" && isStaffOrAdmin && (
                <>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    onClick={() => approveMutation.mutate()}
                    isLoading={approveMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4" /> Approve Reservation
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => setRejecting(true)}
                  >
                    <XCircle className="h-4 w-4" /> Reject Reservation
                  </Button>
                </>
              )}

              {reservation.status === "APPROVED" && isStaffOrAdmin && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  onClick={() => activateMutation.mutate()}
                  isLoading={activateMutation.isPending}
                >
                  <Play className="h-4 w-4" /> Activate Equipment Pickup
                </Button>
              )}

              {reservation.status === "ACTIVE" && (isStaffOrAdmin || isWarehouse) && (
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  onClick={() => setReturning(true)}
                >
                  <RotateCcw className="h-4 w-4" /> Complete Return Inspection
                </Button>
              )}

              {(reservation.status === "PENDING" || reservation.status === "APPROVED") && (
                <Button
                  variant="outline"
                  className="border-slate-300 bg-white text-rose-600 hover:bg-rose-50 gap-2"
                  onClick={() => cancelMutation.mutate()}
                  isLoading={cancelMutation.isPending}
                >
                  <Ban className="h-4 w-4" /> Cancel Reservation
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejecting}
        onClose={() => setRejecting(false)}
        title="Reject Reservation"
        description="Provide a reason for rejecting this reservation request."
        maxWidth="md"
      >
        <div className="space-y-4">
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Item unavailable during specified dates..."
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim()}
              onClick={() => rejectMutation.mutate(rejectionReason.trim())}
              isLoading={rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Return Inspection Modal */}
      <Modal
        isOpen={returning}
        onClose={() => setReturning(false)}
        title="Complete Return"
        description="Add inspection notes for returned equipment."
        maxWidth="md"
      >
        <div className="space-y-4">
          <textarea
            rows={3}
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="e.g. Equipment returned in full working condition."
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setReturning(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => returnMutation.mutate(returnNotes.trim())}
              isLoading={returnMutation.isPending}
            >
              Confirm Return
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );

}

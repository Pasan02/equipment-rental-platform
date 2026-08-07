"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  RotateCcw,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  AlertCircle,
  Calendar,
  User,
  CheckCircle2,
} from "lucide-react";

interface PaymentItem {
  id: string;
  transactionId: string;
  amount: number | string;
  type: "RENTAL" | "DEPOSIT" | "DAMAGE" | "REFUND";
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod?: string;
  metadata?: Record<string, any>;
  paidAt?: string;
  createdAt: string;
  reservationId: string;
  reservation?: {
    reservationNumber: string;
    customer?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Selected Payment for Detail / Refund / Process Modals
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundError, setRefundError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Payments List
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["payments", page, debouncedSearch, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);

      const res = await apiClient.get(`/payments?${params.toString()}`);
      return res.data as {
        success: boolean;
        data: PaymentItem[];
        meta: {
          total: number;
          page: number;
          pageSize: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      };
    },
  });

  // Process Payment Mutation
  const processMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/payments/${id}/process`, { status: "PAID" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setSelectedPayment(null);
    },
  });

  // Refund Payment Mutation
  const refundMutation = useMutation({
    mutationFn: async ({ id, amount, reason }: { id: string; amount?: number; reason?: string }) => {
      await apiClient.post(`/payments/${id}/refund`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setRefundingId(null);
      setRefundReason("");
      setRefundAmount("");
      setRefundError(null);
      setSelectedPayment(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to process refund.";
      setRefundError(msg);
    },
  });

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "RENTAL":
        return "default";
      case "DEPOSIT":
        return "info";
      case "DAMAGE":
        return "warning";
      case "REFUND":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "success";
      case "PENDING":
        return "warning";
      case "FAILED":
      case "REFUNDED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRefundError(null);

    if (!refundingId) return;

    const amt = refundAmount ? parseFloat(refundAmount) : undefined;
    refundMutation.mutate({
      id: refundingId,
      amount: amt,
      reason: refundReason.trim(),
    });
  };

  const items: PaymentItem[] = Array.isArray(paymentsData?.data)
    ? paymentsData.data
    : Array.isArray(paymentsData)
    ? (paymentsData as PaymentItem[])
    : [];
  const meta = paymentsData?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Payments & Transactions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track rental payments, security deposit records, damages, and refunds.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by transaction ID or reservation #..."
              className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400 flex-shrink-0 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full md:w-36 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full md:w-36 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="">All Types</option>
              <option value="RENTAL">RENTAL</option>
              <option value="DEPOSIT">DEPOSIT</option>
              <option value="DAMAGE">DAMAGE</option>
              <option value="REFUND">REFUND</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Reservation #</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-6 w-16 bg-slate-200 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-6 w-16 bg-slate-200 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-8 w-16 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard className="h-10 w-10 text-slate-300 mb-2 stroke-1" />
                      <p className="text-sm font-semibold text-slate-700">No payment records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-semibold text-slate-900">
                      {payment.transactionId}
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-blue-600 font-medium">
                      {payment.reservation?.reservationNumber || "N/A"}
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>

                    <td className="py-4 px-4">
                      <Badge variant={getTypeBadgeVariant(payment.type)} className="text-xs">
                        {payment.type}
                      </Badge>
                    </td>

                    <td className="py-4 px-4">
                      <Badge variant={getStatusBadgeVariant(payment.status)} className="text-xs">
                        {payment.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-500">
                      {formatDateTime(payment.paidAt || payment.createdAt)}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                          onClick={() => setSelectedPayment(payment)}
                          title="View Payment Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {isAdmin && payment.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => processMutation.mutate(payment.id)}
                            title="Process Payment"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {isAdmin && payment.status === "PAID" && payment.type !== "REFUND" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                            onClick={() => {
                              setRefundingId(payment.id);
                              setRefundAmount(String(payment.amount));
                              setRefundError(null);
                            }}
                            title="Issue Refund"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
            <span>
              Page {meta.page} of {meta.totalPages} ({meta.total} transactions)
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

      {/* Payment Details Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title={`Transaction Details — ${selectedPayment?.transactionId || ""}`}
        description="Complete record metadata and associated reservation details."
        maxWidth="md"
      >
        {selectedPayment && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-500 block mb-1">Transaction Status</span>
                <Badge variant={getStatusBadgeVariant(selectedPayment.status)}>
                  {selectedPayment.status}
                </Badge>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block mb-1">Payment Amount</span>
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Type</span>
                <Badge variant={getTypeBadgeVariant(selectedPayment.type)}>
                  {selectedPayment.type}
                </Badge>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Reservation #</span>
                <span className="font-mono text-slate-900 font-semibold">
                  {selectedPayment.reservation?.reservationNumber || "N/A"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Customer</span>
                <span className="text-slate-900 font-medium">
                  {selectedPayment.reservation?.customer
                    ? `${selectedPayment.reservation.customer.firstName} ${selectedPayment.reservation.customer.lastName}`
                    : "N/A"}
                </span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Transaction Date</span>
                <span className="text-slate-700">
                  {formatDateTime(selectedPayment.paidAt || selectedPayment.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              {isAdmin && selectedPayment.status === "PENDING" && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => processMutation.mutate(selectedPayment.id)}
                  isLoading={processMutation.isPending}
                >
                  Process Payment
                </Button>
              )}

              {isAdmin && selectedPayment.status === "PAID" && selectedPayment.type !== "REFUND" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setRefundingId(selectedPayment.id);
                    setRefundAmount(String(selectedPayment.amount));
                    setSelectedPayment(null);
                  }}
                >
                  Issue Refund
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Issue Refund Modal */}
      <Modal
        isOpen={!!refundingId}
        onClose={() => setRefundingId(null)}
        title="Issue Transaction Refund"
        description="Process full or partial refund for this paid transaction."
        maxWidth="md"
      >
        {refundError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{refundError}</span>
          </div>
        )}

        <form onSubmit={handleRefundSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Refund Amount ($)</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="bg-white border-slate-300 text-slate-900"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Refund Reason</label>
            <textarea
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Customer returned equipment early / deposit return..."
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setRefundingId(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={refundMutation.isPending}
            >
              Confirm Refund
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

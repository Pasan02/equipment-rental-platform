"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Search,
  Plus,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Ban,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  Clock,
  AlertCircle,
  Upload,
  FileText,
  Download,
  DollarSign,
} from "lucide-react";

interface ReservationItem {
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
}

interface Reservation {
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
  items?: ReservationItem[];
  uploads?: Array<{
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
  }>;
  _count?: {
    items: number;
  };
}

interface EquipmentOption {
  id: string;
  name: string;
  rentalPricePerDay: number | string;
  depositAmount: number | string;
  availableQuantity: number;
}

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isStaffOrAdmin = user?.role === "ADMIN" || user?.role === "STAFF";
  const isWarehouse = user?.role === "WAREHOUSE";
  const isCustomer = user?.role === "CUSTOMER";
  const isAdmin = user?.role === "ADMIN";
  const canApprove = isStaffOrAdmin;
  const canReturn = isStaffOrAdmin || isWarehouse;
  const canCancel = isCustomer || isAdmin;

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modal states
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [returningId, setReturningId] = useState<string | null>(null);
  const [returnNotes, setReturnNotes] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create Form State
  const [createFormData, setCreateFormData] = useState({
    equipmentId: "",
    quantity: "1",
    pickupDate: "",
    returnDate: "",
    notes: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Available Equipment for Create Form
  const { data: equipmentOptions = [] } = useQuery({
    queryKey: ["equipment-options"],
    queryFn: async () => {
      const res = await apiClient.get("/equipment?pageSize=100&available=true");
      const rawData = res.data?.data;
      const list = Array.isArray(rawData) ? rawData : rawData?.items || [];
      return list as EquipmentOption[];
    },
    enabled: isCreateModalOpen,
  });

  // Fetch Reservations
  const { data: reservationData, isLoading } = useQuery({
    queryKey: ["reservations", page, debouncedSearch, statusTab, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusTab !== "ALL") params.append("status", statusTab);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const res = await apiClient.get(`/reservations?${params.toString()}`);
      return res.data as {
        success: boolean;
        data: Reservation[];
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

  // Action Mutations
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/reservations/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setSelectedReservation(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.patch(`/reservations/${id}/reject`, { rejectionReason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setRejectingId(null);
      setRejectionReason("");
      setSelectedReservation(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/reservations/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setSelectedReservation(null);
    },
  });

  const returnMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      await apiClient.patch(`/reservations/${id}/return`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setReturningId(null);
      setReturnNotes("");
      setSelectedReservation(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/reservations/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setSelectedReservation(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post("/reservations", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setIsCreateModalOpen(false);
      setCreateFormData({
        equipmentId: "",
        quantity: "1",
        pickupDate: "",
        returnDate: "",
        notes: "",
      });
      setCreateError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to submit reservation.";
      setCreateError(msg);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (
      !createFormData.equipmentId ||
      !createFormData.pickupDate ||
      !createFormData.returnDate
    ) {
      setCreateError("Please select an equipment item and pickup/return dates.");
      return;
    }

    const payload = {
      pickupDate: createFormData.pickupDate,
      returnDate: createFormData.returnDate,
      items: [
        {
          equipmentId: createFormData.equipmentId,
          quantity: parseInt(createFormData.quantity, 10),
        },
      ],
      notes: createFormData.notes,
    };

    createMutation.mutate(payload);
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
      case "REJECTED":
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const items: Reservation[] = Array.isArray(reservationData?.data)
    ? reservationData.data
    : Array.isArray(reservationData)
    ? (reservationData as Reservation[])
    : [];
  const meta = reservationData?.meta;

  const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "ACTIVE", "RETURNED", "CANCELLED"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Reservation Lifecycle
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track, approve, activate, and manage equipment reservations.
          </p>
        </div>
        {(isCustomer || isAdmin) && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Reservation
          </Button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatusTab(tab);
              setPage(1);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all capitalize cursor-pointer flex-shrink-0 ${
              statusTab === tab
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Search & Date Controls */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reservation # or customer name..."
              className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="bg-white border-slate-300 text-xs text-slate-900"
            />
            <span className="text-slate-400 text-xs">to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="bg-white border-slate-300 text-xs text-slate-900"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Reservation #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Equipment Summary</th>
                <th className="py-3.5 px-4">Pickup / Return Dates</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading reservations...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 stroke-1" />
                    <p className="font-medium text-slate-700">No reservations found matching filters.</p>
                  </td>
                </tr>
              ) : (
                items.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                      {res.reservationNumber}
                      <span className="text-[10px] text-slate-500 block font-normal font-sans">
                        {formatDateTime(res.createdAt)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900 text-xs">
                            {res.customer
                              ? `${res.customer.firstName} ${res.customer.lastName}`
                              : "N/A"}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                            {res.customer?.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {res.items && res.items.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {res.items[0].equipment?.name || "Equipment Item"}
                            {res.items.length > 1 ? ` +${res.items.length - 1} more` : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">
                          {res._count?.items || 1} reserved items
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-slate-900 font-medium">{formatDate(res.pickupDate)}</div>
                      <div className="text-[10px] text-slate-500">to {formatDate(res.returnDate)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{formatCurrency(res.totalAmount)}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Dep: {formatCurrency(res.depositTotal)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusBadgeVariant(res.status)} className="text-[10px] px-2 py-0.5">
                        {res.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                          onClick={() => setSelectedReservation(res)}
                          title="View reservation detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
            <div>
              Page {meta.page} of {meta.totalPages} ({meta.total} reservations)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage(page - 1)}
                className="h-8 border-slate-300 bg-white text-slate-600"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage(page + 1)}
                className="h-8 border-slate-300 bg-white text-slate-600"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Reservation Detail Modal */}
      <Modal
        isOpen={!!selectedReservation}
        onClose={() => setSelectedReservation(null)}
        title={`Reservation Details — ${selectedReservation?.reservationNumber || ""}`}
        description="Comprehensive summary of equipment items, dates, and financial metrics."
        maxWidth="2xl"
      >
        {selectedReservation && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 text-xs">
            {/* Status & Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-500 font-medium block">Current Status</span>
                <Badge variant={getStatusBadgeVariant(selectedReservation.status)} className="mt-1">
                  {selectedReservation.status}
                </Badge>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium block">Rental Duration</span>
                <span className="text-slate-900 font-semibold">
                  {formatDate(selectedReservation.pickupDate)} — {formatDate(selectedReservation.returnDate)}
                </span>
              </div>
            </div>

            {/* Rejection Reason notice if REJECTED */}
            {selectedReservation.rejectionReason && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                <span className="font-semibold block mb-0.5">Rejection Reason:</span>
                <p>{selectedReservation.rejectionReason}</p>
              </div>
            )}

            {/* Customer Details Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-500 block mb-0.5">Customer Profile</span>
                <p className="font-semibold text-slate-900">
                  {selectedReservation.customer?.firstName} {selectedReservation.customer?.lastName}
                </p>
                <p className="text-slate-600">{selectedReservation.customer?.email}</p>
                <p className="text-slate-600">{selectedReservation.customer?.phone}</p>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Financial Summary</span>
                <p className="text-slate-700">
                  Rental Total: <span className="font-semibold text-slate-900">{formatCurrency(selectedReservation.totalAmount)}</span>
                </p>
                <p className="text-slate-700">
                  Security Deposit: <span className="font-semibold text-slate-900">{formatCurrency(selectedReservation.depositTotal)}</span>
                </p>
              </div>
            </div>

            {/* Reserved Items List */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Reserved Items</h4>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
                {selectedReservation.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Package className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-slate-900">{item.equipment?.name || "Equipment"}</p>
                        <p className="text-[10px] text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-blue-600">{formatCurrency(item.subtotal)}</span>
                      <span className="text-[10px] text-slate-500 block">Dep: {formatCurrency(item.deposit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attached Rental Documents Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-900">Rental Documents & Verification</h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] border-slate-300 text-blue-600 hover:bg-blue-50 gap-1 cursor-pointer"
                  onClick={() => setShowDocUpload(!showDocUpload)}
                >
                  <Upload className="h-3.5 w-3.5" /> {showDocUpload ? "Hide Uploader" : "Upload Document"}
                </Button>
              </div>

              {showDocUpload && (
                <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <FileUpload
                    type="RENTAL_AGREEMENT"
                    reservationId={selectedReservation.id}
                    label="Attach Rental Agreement or Verification Doc"
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ["reservations"] });
                    }}
                  />
                </div>
              )}

              {selectedReservation.uploads && selectedReservation.uploads.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
                  {selectedReservation.uploads.map((doc: any) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900">{doc.fileName}</p>
                          <span className="text-[10px] text-slate-500">{doc.type}</span>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-[11px] p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  No rental agreement or verification documents attached to this reservation yet.
                </p>
              )}
            </div>

            {/* Actions Toolbar in Modal */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              {selectedReservation.status === "PENDING" && canApprove && (
                <>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    onClick={() => approveMutation.mutate(selectedReservation.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                    onClick={() => setRejectingId(selectedReservation.id)}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </>
              )}

              {selectedReservation.status === "APPROVED" && canApprove && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                  onClick={() => activateMutation.mutate(selectedReservation.id)}
                >
                  <Play className="h-3.5 w-3.5" /> Activate Pickup
                </Button>
              )}

              {selectedReservation.status === "ACTIVE" && canReturn && (
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                  onClick={() => setReturningId(selectedReservation.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Complete Return
                </Button>
              )}

              {(selectedReservation.status === "PENDING" || selectedReservation.status === "APPROVED") && canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-300 text-rose-600 hover:bg-rose-50 gap-1"
                  onClick={() => cancelMutation.mutate(selectedReservation.id)}
                >
                  <Ban className="h-3.5 w-3.5" /> Cancel Reservation
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectingId}
        onClose={() => setRejectingId(null)}
        title="Reject Reservation"
        description="Please provide a clear rejection reason for the customer."
        maxWidth="md"
      >
        <div className="space-y-4">
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Equipment unavailable due to scheduled maintenance..."
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
            required
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setRejectingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim()}
              onClick={() =>
                rejectingId &&
                rejectMutation.mutate({ id: rejectingId, reason: rejectionReason.trim() })
              }
              isLoading={rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Return Notes Modal */}
      <Modal
        isOpen={!!returningId}
        onClose={() => setReturningId(null)}
        title="Complete Return Inspection"
        description="Record optional inspection notes regarding equipment condition upon return."
        maxWidth="md"
      >
        <div className="space-y-4">
          <textarea
            rows={3}
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="e.g. Returned in good condition, battery fully charged."
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setReturningId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() =>
                returningId &&
                returnMutation.mutate({ id: returningId, notes: returnNotes.trim() })
              }
              isLoading={returnMutation.isPending}
            >
              Process Return
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Reservation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Reservation"
        description="Reserve professional equipment for specified rental dates."
        maxWidth="md"
      >
        {createError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{createError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Select Equipment *</label>
            <select
              value={createFormData.equipmentId}
              onChange={(e) => setCreateFormData({ ...createFormData, equipmentId: e.target.value })}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              required
            >
              <option value="">Choose Equipment Item...</option>
              {equipmentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — ${item.rentalPricePerDay}/day ({item.availableQuantity} available)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Pickup Date *</label>
              <Input
                type="date"
                value={createFormData.pickupDate}
                onChange={(e) => setCreateFormData({ ...createFormData, pickupDate: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Return Date *</label>
              <Input
                type="date"
                value={createFormData.returnDate}
                onChange={(e) => setCreateFormData({ ...createFormData, returnDate: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Quantity *</label>
            <Input
              type="number"
              min="1"
              value={createFormData.quantity}
              onChange={(e) => setCreateFormData({ ...createFormData, quantity: e.target.value })}
              className="bg-white border-slate-300 text-slate-900"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Reservation Notes</label>
            <textarea
              rows={2}
              value={createFormData.notes}
              onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
              placeholder="Special instructions or project requirements..."
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={createMutation.isPending}
            >
              Submit Reservation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

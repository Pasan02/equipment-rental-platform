"use client";

import { useState } from "react";
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
  Boxes,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Wrench,
  History,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";

interface InventoryStockItem {
  id?: string;
  equipmentId: string;
  name: string;
  categoryName: string;
  totalStock: number;
  available: number;
  reserved: number;
  maintenance: number;
  damaged: number;
}

interface InventorySummary {
  totalEquipment?: number;
  totalEquipmentCount?: number;
  totalStock?: number;
  totalStockQuantity?: number;
  availableStock?: number;
  totalAvailableQuantity?: number;
  utilizationPercentage?: number;
  utilizationRatePercent?: number;
}

interface InventoryLog {
  id: string;
  action: "RECEIVED" | "RELEASED" | "DAMAGED" | "MAINTENANCE" | "ADJUSTMENT";
  quantityChange: number;
  notes?: string;
  createdAt: string;
  equipment?: {
    name: string;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isWarehouseOrAdmin =
    user?.role === "ADMIN" || user?.role === "STAFF" || user?.role === "WAREHOUSE";

  // Search filter state
  const [search, setSearch] = useState("");

  // Action Modals State
  const [activeModal, setActiveModal] = useState<
    "RECEIVE" | "RELEASE" | "DAMAGE" | "MAINTENANCE" | null
  >(null);
  const [historyEquipment, setHistoryEquipment] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Action Form State
  const [actionForm, setActionForm] = useState({
    equipmentId: "",
    quantity: "1",
    notes: "",
    chargeDamageFee: false,
    damageFeeAmount: "0",
  });
  const [actionError, setActionError] = useState<string | null>(null);

  // History Pagination
  const [historyPage, setHistoryPage] = useState(1);

  // Fetch Inventory Stock Overview
  const { data: stockData, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await apiClient.get("/inventory");
      return res.data.data as {
        summary: InventorySummary;
        items: InventoryStockItem[];
      };
    },
  });

  // Fetch History for selected equipment
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["inventory-history", historyEquipment?.id, historyPage],
    queryFn: async () => {
      if (!historyEquipment) return null;
      const res = await apiClient.get(
        `/inventory/${historyEquipment.id}/history?page=${historyPage}&pageSize=6`
      );
      const dataObj = res.data?.data || res.data;
      return {
        items: (dataObj?.items || []) as InventoryLog[],
        meta: (dataObj?.meta || {
          total: 0,
          page: 1,
          pageSize: 6,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        }) as {
          total: number;
          page: number;
          pageSize: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        },
      };
    },
    enabled: !!historyEquipment,
  });

  // Warehouse Action Mutations
  const actionMutation = useMutation({
    mutationFn: async ({ endpoint, payload }: { endpoint: string; payload: any }) => {
      const res = await apiClient.post(`/inventory/${endpoint}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      if (historyEquipment) {
        queryClient.invalidateQueries({
          queryKey: ["inventory-history", historyEquipment.id],
        });
      }
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to process warehouse operation.";
      setActionError(msg);
    },
  });

  const stockSummary = stockData?.summary;
  const stockItems: InventoryStockItem[] = (stockData?.items || [])
    .map((item: any) => ({
      id: item.id || item.equipmentId,
      equipmentId: item.id || item.equipmentId,
      name: item.name || "Equipment",
      categoryName: item.category?.name || item.categoryName || "Gear",
      totalStock: item.stockQuantity ?? item.totalStock ?? 0,
      available: item.availableQuantity ?? item.available ?? 0,
      reserved: item.reservedQuantity ?? item.reserved ?? 0,
      maintenance: item.maintenance ?? 0,
      damaged: item.damaged ?? 0,
    }))
    .filter((item: InventoryStockItem) => {
      const itemName = item.name || "";
      const catName = item.categoryName || "";
      return (
        itemName.toLowerCase().includes(search.toLowerCase()) ||
        catName.toLowerCase().includes(search.toLowerCase())
      );
    });

  const openModal = (type: "RECEIVE" | "RELEASE" | "DAMAGE" | "MAINTENANCE") => {
    setActionForm({
      equipmentId: stockItems[0]?.equipmentId || stockItems[0]?.id || "",
      quantity: "1",
      notes: "",
      chargeDamageFee: false,
      damageFeeAmount: "0",
    });
    setActionError(null);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActionError(null);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!actionForm.equipmentId || !actionForm.quantity) {
      setActionError("Please select equipment and enter quantity.");
      return;
    }

    const qty = parseInt(actionForm.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setActionError("Quantity must be greater than 0.");
      return;
    }

    let endpoint = "";
    let payload: any = {
      equipmentId: actionForm.equipmentId,
      quantity: qty,
      notes: actionForm.notes,
    };

    switch (activeModal) {
      case "RECEIVE":
        endpoint = "receive";
        break;
      case "RELEASE":
        endpoint = "release";
        break;
      case "DAMAGE":
        endpoint = "damage";
        payload.chargeDamageFee = actionForm.chargeDamageFee;
        if (actionForm.chargeDamageFee) {
          payload.damageFeeAmount = parseFloat(actionForm.damageFeeAmount || "0");
        }
        break;
      case "MAINTENANCE":
        endpoint = "maintenance";
        break;
    }

    actionMutation.mutate({ endpoint, payload });
  };

  const getStockHealthIndicator = (available: number, total: number) => {
    if (available === 0) return "bg-rose-500 text-rose-400 border-rose-500/30";
    if (available / total <= 0.25) return "bg-amber-500 text-amber-400 border-amber-500/30";
    return "bg-emerald-500 text-emerald-400 border-emerald-500/30";
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "RECEIVED":
        return "success";
      case "RELEASED":
        return "info";
      case "DAMAGED":
        return "destructive";
      case "MAINTENANCE":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Operations Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Warehouse Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock levels, warehouse ops, damage reporting, and maintenance.
          </p>
        </div>

        {isWarehouseOrAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => openModal("RECEIVE")}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <ArrowDownLeft className="h-4 w-4" /> Receive Stock
            </Button>
            <Button
              onClick={() => openModal("RELEASE")}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
            >
              <ArrowUpRight className="h-4 w-4" /> Release Stock
            </Button>
            <Button
              onClick={() => openModal("MAINTENANCE")}
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5 cursor-pointer shadow-md shadow-amber-600/20"
            >
              <Wrench className="h-4 w-4" /> Maintenance
            </Button>
            <Button
              onClick={() => openModal("DAMAGE")}
              size="sm"
              variant="outline"
              className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="h-4 w-4 text-rose-600" /> Damage Log
            </Button>
          </div>
        )}
      </div>

      {/* 4-Card Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Catalog Items
          </span>
          <span className="text-2xl font-bold text-slate-900 font-heading">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              stockSummary?.totalEquipmentCount ?? stockSummary?.totalEquipment ?? 0
            )}
          </span>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Stock Quantity
          </span>
          <span className="text-2xl font-bold text-slate-900 font-heading">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              stockSummary?.totalStockQuantity ?? stockSummary?.totalStock ?? 0
            )}
          </span>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Available On Shelf
          </span>
          <span className="text-2xl font-bold text-emerald-600 font-heading">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              stockSummary?.totalAvailableQuantity ?? stockSummary?.availableStock ?? 0
            )}
          </span>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Stock Utilization
          </span>
          <span className="text-2xl font-bold text-blue-600 font-heading">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              `${(
                stockSummary?.utilizationRatePercent ??
                stockSummary?.utilizationPercentage ??
                0
              ).toFixed(1)}%`
            )}
          </span>
        </Card>
      </div>

      {/* Filter Bar */}
      {/* Search Input */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory by equipment name or category..."
            className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </Card>

      {/* Stock Overview Table */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Equipment</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Total Stock</th>
                <th className="py-3.5 px-4">Available</th>
                <th className="py-3.5 px-4">Reserved</th>
                <th className="py-3.5 px-4">Maintenance</th>
                <th className="py-3.5 px-4">Damaged</th>
                <th className="py-3.5 px-4 text-right">Log History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-36 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-8 w-16 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : stockItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Boxes className="h-10 w-10 text-slate-300 mb-2 stroke-1" />
                      <p className="text-sm font-semibold text-slate-700">No inventory items found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                stockItems.map((item) => (
                  <tr key={item.equipmentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2.5 w-2.5 rounded-full border ${getStockHealthIndicator(
                            item.available,
                            item.totalStock
                          )}`}
                          title={`Stock availability: ${item.available}/${item.totalStock}`}
                        />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="secondary" className="text-xs">
                        {item.categoryName}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900">{item.totalStock}</td>
                    <td className="py-4 px-4 text-emerald-700 font-semibold">{item.available}</td>
                    <td className="py-4 px-4 text-blue-700 font-semibold">{item.reserved}</td>
                    <td className="py-4 px-4 text-amber-700 font-semibold">{item.maintenance}</td>
                    <td className="py-4 px-4 text-rose-700 font-semibold">{item.damaged}</td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-600 hover:text-slate-900"
                        onClick={() => {
                          setHistoryEquipment({ id: item.equipmentId, name: item.name });
                          setHistoryPage(1);
                        }}
                      >
                        <History className="h-3.5 w-3.5 mr-1" /> Logs
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Warehouse Operation Modal (Receive / Release / Damage / Maintenance) */}
      <Modal
        isOpen={!!activeModal}
        onClose={closeModal}
        title={
          activeModal === "RECEIVE"
            ? "Receive New Stock"
            : activeModal === "RELEASE"
            ? "Release Equipment Stock"
            : activeModal === "DAMAGE"
            ? "Report Damaged Equipment"
            : "Place Equipment in Maintenance"
        }
        description="Update physical inventory records and trigger stock movement events."
        maxWidth="md"
      >
        {actionError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Select Equipment *</label>
            <select
              value={actionForm.equipmentId}
              onChange={(e) => setActionForm({ ...actionForm, equipmentId: e.target.value })}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              required
            >
              {stockItems.map((item) => (
                <option key={item.equipmentId} value={item.equipmentId}>
                  {item.name} ({item.available} available / {item.totalStock} total)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Quantity *</label>
            <Input
              type="number"
              min="1"
              value={actionForm.quantity}
              onChange={(e) => setActionForm({ ...actionForm, quantity: e.target.value })}
              className="bg-white border-slate-300 text-slate-900"
              required
            />
          </div>

          {activeModal === "DAMAGE" && (
            <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={actionForm.chargeDamageFee}
                  onChange={(e) =>
                    setActionForm({ ...actionForm, chargeDamageFee: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Charge Damage Fee Payment Record</span>
              </label>

              {actionForm.chargeDamageFee && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Damage Fee Amount ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={actionForm.damageFeeAmount}
                    onChange={(e) =>
                      setActionForm({ ...actionForm, damageFeeAmount: e.target.value })
                    }
                    className="bg-white border-slate-300 text-slate-900"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Warehouse Notes</label>
            <textarea
              rows={3}
              value={actionForm.notes}
              onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
              placeholder="Record inspection details, shipment numbers, or damage severity..."
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className={
                activeModal === "DAMAGE"
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : activeModal === "MAINTENANCE"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }
              isLoading={actionMutation.isPending}
            >
              Submit Operation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Equipment Inventory History Log Modal */}
      <Modal
        isOpen={!!historyEquipment}
        onClose={() => setHistoryEquipment(null)}
        title={`Inventory History — ${historyEquipment?.name || ""}`}
        description="Audit log of all stock arrivals, releases, damages, and maintenance events."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {isLoadingHistory ? (
            <div className="py-8 text-center text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading history...
            </div>
          ) : !historyData || historyData.items.length === 0 ? (
            <p className="py-8 text-center text-slate-400">No inventory history logs for this item.</p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden">
              {historyData.items.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionBadgeVariant(log.action)} className="text-[10px] px-2 py-0">
                        {log.action}
                      </Badge>
                      <span className="font-semibold text-slate-900">
                        Quantity Change: {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                      </span>
                    </div>
                    {log.notes && <p className="text-slate-600">{log.notes}</p>}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <User className="h-3 w-3" />
                      <span>
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Warehouse Staff"}
                      </span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History Pagination */}
          {historyData?.meta && historyData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-slate-600">
              <span>
                Page {historyData.meta.page} of {historyData.meta.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!historyData.meta.hasPrevPage}
                  onClick={() => setHistoryPage(historyPage - 1)}
                  className="h-7 text-xs border-slate-300 bg-white"
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!historyData.meta.hasNextPage}
                  onClick={() => setHistoryPage(historyPage + 1)}
                  className="h-7 text-xs border-slate-300 bg-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

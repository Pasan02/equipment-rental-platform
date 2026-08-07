"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  Eye,
  Camera,
  Loader2,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Layers,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface EquipmentImage {
  id?: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface EquipmentItem {
  id: string;
  name: string;
  description: string;
  rentalPricePerDay: number | string;
  depositAmount: number | string;
  stockQuantity: number;
  availableQuantity: number;
  specifications: Record<string, any>;
  qrCode: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  images?: EquipmentImage[];
  isActive: boolean;
  createdAt: string;
}

export default function EquipmentPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";
  const isAdmin = user?.role === "ADMIN";

  // Filter & Pagination state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rentalPricePerDay: "",
    depositAmount: "",
    stockQuantity: "1",
    categoryId: "",
    imageUrl: "",
  });
  const [specPairs, setSpecPairs] = useState<Array<{ key: string; value: string }>>([
    { key: "", value: "" },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiClient.get("/categories");
      return res.data.data as Category[];
    },
  });

  // Fetch Equipment List
  const { data: equipmentData, isLoading } = useQuery({
    queryKey: ["equipment", page, debouncedSearch, categoryId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (categoryId) params.append("categoryId", categoryId);
      if (statusFilter === "active") params.append("isActive", "true");
      if (statusFilter === "inactive") params.append("isActive", "false");

      const res = await apiClient.get(`/equipment?${params.toString()}`);
      return res.data.data as {
        items: EquipmentItem[];
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

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Equipment Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post("/equipment", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      setSuccessMsg("Equipment item created successfully!");
      closeModal();
      setTimeout(() => setSuccessMsg(null), 5000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to create equipment item.";
      setFormError(msg);
    },
  });

  // Update Equipment Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiClient.put(`/equipment/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      setSuccessMsg("Equipment item updated successfully!");
      closeModal();
      setTimeout(() => setSuccessMsg(null), 5000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to update equipment item.";
      setFormError(msg);
    },
  });

  // Toggle Active Status Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (item: EquipmentItem) => {
      await apiClient.put(`/equipment/${item.id}`, { isActive: !item.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      setSuccessMsg("Equipment status updated.");
      setTimeout(() => setSuccessMsg(null), 4000);
    },
  });

  // Delete Equipment Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/equipment/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      setDeletingId(null);
      setSuccessMsg("Equipment item deleted.");
      setTimeout(() => setSuccessMsg(null), 4000);
    },
  });

  const openCreateModal = () => {
    setEditingEquipment(null);
    setFormData({
      name: "",
      description: "",
      rentalPricePerDay: "",
      depositAmount: "0",
      stockQuantity: "1",
      categoryId: categories[0]?.id || "",
      imageUrl: "",
    });
    setSpecPairs([{ key: "", value: "" }]);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (item: EquipmentItem) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      rentalPricePerDay: String(item.rentalPricePerDay),
      depositAmount: String(item.depositAmount),
      stockQuantity: String(item.stockQuantity),
      categoryId: item.categoryId,
      imageUrl: item.images?.[0]?.imageUrl || "",
    });

    const specsObj = item.specifications || {};
    const parsedSpecs = Object.entries(specsObj).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    setSpecPairs(parsedSpecs.length > 0 ? parsedSpecs : [{ key: "", value: "" }]);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setEditingEquipment(null);
    setFormError(null);
  };

  const handleSpecChange = (index: number, field: "key" | "value", val: string) => {
    const updated = [...specPairs];
    updated[index][field] = val;
    setSpecPairs(updated);
  };

  const addSpecPair = () => {
    setSpecPairs([...specPairs, { key: "", value: "" }]);
  };

  const removeSpecPair = (index: number) => {
    setSpecPairs(specPairs.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name || !formData.rentalPricePerDay || !formData.categoryId) {
      setFormError("Please fill out all required fields.");
      return;
    }

    const specifications: Record<string, string> = {};
    specPairs.forEach((pair) => {
      if (pair.key.trim()) {
        specifications[pair.key.trim()] = pair.value.trim();
      }
    });

    const payload: any = {
      name: formData.name,
      description: formData.description,
      rentalPricePerDay: parseFloat(formData.rentalPricePerDay),
      depositAmount: parseFloat(formData.depositAmount || "0"),
      stockQuantity: parseInt(formData.stockQuantity, 10),
      categoryId: formData.categoryId,
      specifications,
    };

    if (formData.imageUrl.trim()) {
      payload.images = [
        {
          imageUrl: formData.imageUrl.trim(),
          isPrimary: true,
          sortOrder: 1,
        },
      ];
    }

    if (editingEquipment) {
      updateMutation.mutate({ id: editingEquipment.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const items: EquipmentItem[] = (equipmentData as any)?.data || equipmentData?.items || [];
  const meta = equipmentData?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Equipment Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, manage inventory, and configure rental equipment.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Equipment
          </Button>
        )}
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment by name or description..."
              className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400 flex-shrink-0 hidden sm:block" />
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full md:w-48 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (Admin/Staff) */}
          {canManage && (
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="h-10 w-full md:w-36 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          )}
        </CardContent>
      </Card>

      {/* Equipment Data Table */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Equipment</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Daily Price</th>
                <th className="py-3.5 px-4">Deposit</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-200 flex-shrink-0" />
                        <div className="space-y-1">
                          <div className="h-4 w-36 bg-slate-200 rounded" />
                          <div className="h-3 w-24 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-6 w-16 bg-slate-200 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-8 w-16 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Camera className="h-10 w-10 text-slate-300 mb-2 stroke-1" />
                      <p className="text-sm font-semibold text-slate-700">No equipment found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting search or category filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.images?.[0]?.imageUrl ? (
                            <img
                              src={item.images[0].imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Camera className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/equipment/${item.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{item.description || "No description"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="secondary" className="text-xs">
                        {item.category?.name || "General"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900">${Number(item.rentalPricePerDay).toFixed(2)}/day</td>
                    <td className="py-4 px-4 text-slate-600">${Number(item.depositAmount).toFixed(2)}</td>
                    <td className="py-4 px-4 text-slate-700 font-medium">{item.availableQuantity} available</td>
                    <td className="py-4 px-4">
                      {item.isActive ? (
                        <Badge variant="success" className="text-xs">Available</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/equipment/${item.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-blue-600"
                              onClick={() => openEditModal(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-rose-600"
                              onClick={() => setDeletingId(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
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
              Showing {(Math.min((meta.page - 1) * meta.pageSize + 1, meta.total))} to {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total} items
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage(meta.page - 1)}
              >
                Previous
              </Button>
              <span className="font-semibold text-slate-900">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage(meta.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add / Edit Equipment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeModal}
        title={editingEquipment ? "Edit Equipment" : "Add New Equipment"}
        description={
          editingEquipment
            ? "Update equipment specifications, inventory pricing, or catalog details."
            : "Register a new equipment item to your rental catalog."
        }
        maxWidth="xl"
      >
        {formError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Equipment Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sony FX3 Cinema Camera"
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Stock Quantity *</label>
              <Input
                type="number"
                min="1"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Daily Rental Price ($) *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.rentalPricePerDay}
                onChange={(e) => setFormData({ ...formData, rentalPricePerDay: e.target.value })}
                placeholder="150.00"
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Security Deposit ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                placeholder="500.00"
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Image URL</label>
            <Input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/photo-..."
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Full frame cinema line camera with outstanding low-light performance..."
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          {/* Specifications Key-Value Pair Editor */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Specifications (Dynamic Keys)</label>
              <button
                type="button"
                onClick={addSpecPair}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                + Add Spec
              </button>
            </div>
            {specPairs.map((pair, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={pair.key}
                  onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                  placeholder="Key (e.g. Resolution)"
                  className="bg-white border-slate-300 text-slate-900 text-xs h-9 placeholder:text-slate-400"
                />
                <Input
                  value={pair.value}
                  onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                  placeholder="Value (e.g. 4K 120fps)"
                  className="bg-white border-slate-300 text-slate-900 text-xs h-9 placeholder:text-slate-400"
                />
                {specPairs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpecPair(index)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingEquipment ? "Save Changes" : "Create Item"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Confirm Deletion"
        description="Are you sure you want to soft-delete this equipment item? This action will disable it from future customer reservations."
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="ghost" onClick={() => setDeletingId(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

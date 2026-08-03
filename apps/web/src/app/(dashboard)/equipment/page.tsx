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

  // Create Equipment Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post("/equipment", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      closeModal();
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
      closeModal();
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

  const items = equipmentData?.items || [];
  const meta = equipmentData?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Equipment Catalog
          </h1>
          <p className="text-sm text-slate-400 mt-1">
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

      {/* Filter & Search Bar */}
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment by name or description..."
              className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-500 flex-shrink-0 hidden sm:block" />
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full md:w-48 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
              className="h-10 w-full md:w-36 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          )}
        </CardContent>
      </Card>

      {/* Equipment Data Table */}
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading equipment catalog...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Camera className="h-8 w-8 mx-auto mb-2 stroke-1" />
                    <p className="font-medium text-slate-400">No equipment found matching criteria.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.images?.[0]?.imageUrl ? (
                            <img
                              src={item.images[0].imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Camera className="h-5 w-5 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/equipment/${item.id}`}
                            className="font-semibold text-white hover:text-blue-400 transition-colors block cursor-pointer"
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <QrCode className="h-3 w-3 text-slate-500" />
                            <span className="text-[10px] text-slate-500 font-mono">
                              {item.qrCode}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-xs bg-slate-950 text-slate-300 border-slate-800">
                        {item.category?.name || "Uncategorized"}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-blue-400">
                      {formatCurrency(item.rentalPricePerDay)}
                      <span className="text-[10px] text-slate-500 font-normal"> /day</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                      {formatCurrency(item.depositAmount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <span className="font-semibold text-white">{item.availableQuantity}</span>
                        <span className="text-slate-500"> / {item.stockQuantity} avail</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={item.isActive ? "success" : "secondary"}
                        className="text-[10px] px-2 py-0.5 cursor-pointer"
                        onClick={() => canManage && toggleActiveMutation.mutate(item)}
                        title={canManage ? "Click to toggle status" : undefined}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/equipment/${item.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-white"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-blue-400"
                            onClick={() => openEditModal(item)}
                            title="Edit equipment"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}

                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-rose-400"
                            onClick={() => setDeletingId(item.id)}
                            title="Delete equipment"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Pagination Bar */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
            <div>
              Page {meta.page} of {meta.totalPages} ({meta.total} items)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage(page - 1)}
                className="h-8 border-slate-800 bg-slate-900 text-slate-300"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage(page + 1)}
                className="h-8 border-slate-800 bg-slate-900 text-slate-300"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
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
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Equipment Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sony FX3 Cinema Camera"
              className="bg-slate-950 border-slate-800 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
              <label className="text-xs font-semibold text-slate-300">Stock Quantity *</label>
              <Input
                type="number"
                min="1"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="bg-slate-950 border-slate-800 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Daily Rental Price ($) *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.rentalPricePerDay}
                onChange={(e) => setFormData({ ...formData, rentalPricePerDay: e.target.value })}
                placeholder="150.00"
                className="bg-slate-950 border-slate-800 text-white"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Security Deposit ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                placeholder="500.00"
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Image URL</label>
            <Input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/photo-..."
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Full frame cinema line camera with outstanding low-light performance..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Specifications Key-Value Pair Editor */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Specifications (Dynamic Keys)</label>
              <button
                type="button"
                onClick={addSpecPair}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
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
                  className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                />
                <Input
                  value={pair.value}
                  onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                  placeholder="Value (e.g. 4K 120fps)"
                  className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                />
                {specPairs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpecPair(index)}
                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white"
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
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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

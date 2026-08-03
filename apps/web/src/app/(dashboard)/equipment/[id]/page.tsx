"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft,
  Camera,
  QrCode,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Boxes,
  ShieldCheck,
} from "lucide-react";

interface EquipmentImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
}

interface EquipmentDetail {
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

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Availability Checker Form State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [checkQuantity, setCheckQuantity] = useState("1");
  const [availabilityResult, setAvailabilityResult] = useState<{
    available: boolean;
    availableQuantity: number;
    requestedQuantity: number;
  } | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Fetch Equipment Detail
  const { data: equipment, isLoading, isError } = useQuery({
    queryKey: ["equipment", id],
    queryFn: async () => {
      const res = await apiClient.get(`/equipment/${id}`);
      return res.data.data as EquipmentDetail;
    },
  });

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setIsCheckingAvailability(true);
    setAvailabilityResult(null);

    try {
      const res = await apiClient.get(
        `/equipment/${id}/availability?startDate=${startDate}&endDate=${endDate}&quantity=${checkQuantity}`
      );
      setAvailabilityResult(res.data.data);
    } catch {
      // Ignore availability check errors
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Loading equipment details...
      </div>
    );
  }

  if (isError || !equipment) {
    return (
      <div className="py-16 text-center text-slate-400 space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Equipment Not Found</h2>
        <p className="text-sm text-slate-500">The requested equipment item does not exist or was removed.</p>
        <Link href="/equipment">
          <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-200">
            Back to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  const primaryImg = equipment.images?.[0]?.imageUrl;
  const currentImg = selectedImage || primaryImg;
  const specs = equipment.specifications || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Action Header */}
      <div className="flex items-center justify-between">
        <Link href="/equipment">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900 gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Catalog
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant={equipment.isActive ? "success" : "secondary"}>
            {equipment.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Main Grid: Gallery + Pricing & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="h-96 w-full rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden relative shadow-sm">
            {currentImg ? (
              <img src={currentImg} alt={equipment.name} className="h-full w-full object-contain p-4" />
            ) : (
              <Camera className="h-16 w-16 text-slate-300 stroke-1" />
            )}
          </div>

          {equipment.images && equipment.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {equipment.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`h-16 w-16 rounded-xl bg-slate-50 border overflow-hidden transition-all cursor-pointer ${
                    currentImg === img.imageUrl
                      ? "border-blue-600 ring-2 ring-blue-600/30"
                      : "border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Overview & Pricing Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {equipment.category?.name || "Equipment"}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                <QrCode className="h-3.5 w-3.5" />
                {equipment.qrCode}
              </div>
            </div>
            <h1 className="text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
              {equipment.name}
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              {equipment.description || "No description provided for this equipment item."}
            </p>
          </div>

          {/* Key Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Daily Rate
              </span>
              <span className="text-xl font-bold text-blue-600 font-heading">
                {formatCurrency(equipment.rentalPricePerDay)}
              </span>
            </Card>

            <Card className="border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Deposit
              </span>
              <span className="text-xl font-bold text-slate-900 font-heading">
                {formatCurrency(equipment.depositAmount)}
              </span>
            </Card>

            <Card className="border-slate-200 bg-white p-4 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Stock Status
              </span>
              <span className="text-xl font-bold text-emerald-600 font-heading">
                {equipment.availableQuantity} / {equipment.stockQuantity}
              </span>
            </Card>
          </div>

          {/* Date Availability Checker */}
          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" /> Check Date Range Availability
            </h3>
            <form onSubmit={handleCheckAvailability} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Pickup Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white border-slate-300 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Return Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white border-slate-300 text-xs text-slate-900"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                isLoading={isCheckingAvailability}
              >
                Verify Availability
              </Button>
            </form>

            {availabilityResult && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                {availabilityResult.available ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Available! ({availabilityResult.availableQuantity} units in stock for selected dates)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Unavailable for selected dates (Only {availabilityResult.availableQuantity} units available).
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Specifications Table */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900 font-heading">
            Technical Specifications
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Detailed hardware features and manufacturer specifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(specs).length === 0 ? (
            <p className="text-xs text-slate-400">No technical specifications configured for this item.</p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              {Object.entries(specs).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 text-xs">
                  <span className="font-semibold text-slate-700 capitalize">{key}</span>
                  <span className="font-mono text-slate-900">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

}

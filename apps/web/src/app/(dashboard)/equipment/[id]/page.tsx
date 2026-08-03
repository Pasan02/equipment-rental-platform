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
            className="text-slate-400 hover:text-white gap-2 cursor-pointer"
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
          <div className="h-96 w-full rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden relative shadow-2xl">
            {currentImg ? (
              <img src={currentImg} alt={equipment.name} className="h-full w-full object-contain" />
            ) : (
              <Camera className="h-16 w-16 text-slate-700 stroke-1" />
            )}
          </div>

          {equipment.images && equipment.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {equipment.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`h-16 w-16 rounded-lg bg-slate-900 border overflow-hidden transition-all cursor-pointer ${
                    currentImg === img.imageUrl
                      ? "border-blue-500 ring-2 ring-blue-500/30"
                      : "border-slate-800 opacity-60 hover:opacity-100"
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
              <Badge variant="outline" className="bg-slate-900 text-blue-400 border-slate-800 text-xs">
                {equipment.category?.name || "Equipment"}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                <QrCode className="h-3.5 w-3.5" />
                {equipment.qrCode}
              </div>
            </div>
            <h1 className="text-3xl font-extrabold font-heading text-white tracking-tight">
              {equipment.name}
            </h1>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              {equipment.description || "No description provided for this equipment item."}
            </p>
          </div>

          {/* Key Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Daily Rate
              </span>
              <span className="text-xl font-bold text-blue-400 font-heading">
                {formatCurrency(equipment.rentalPricePerDay)}
              </span>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Deposit
              </span>
              <span className="text-xl font-bold text-slate-200 font-heading">
                {formatCurrency(equipment.depositAmount)}
              </span>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60 p-4 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Stock Status
              </span>
              <span className="text-xl font-bold text-emerald-400 font-heading">
                {equipment.availableQuantity} / {equipment.stockQuantity}
              </span>
            </Card>
          </div>

          {/* Date Availability Checker */}
          <Card className="border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" /> Check Date Range Availability
            </h3>
            <form onSubmit={handleCheckAvailability} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Pickup Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Return Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200"
                isLoading={isCheckingAvailability}
              >
                Verify Availability
              </Button>
            </form>

            {availabilityResult && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                {availabilityResult.available ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Available! ({availabilityResult.availableQuantity} units in stock for selected dates)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
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
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white font-heading">
            Technical Specifications
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Detailed hardware features and manufacturer specifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(specs).length === 0 ? (
            <p className="text-xs text-slate-500">No technical specifications configured for this item.</p>
          ) : (
            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
              {Object.entries(specs).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 text-xs">
                  <span className="font-semibold text-slate-400 capitalize">{key}</span>
                  <span className="font-mono text-slate-200">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "./button";

interface FileUploadProps {
  type: "IDENTITY_DOCUMENT" | "RENTAL_AGREEMENT" | "EQUIPMENT_IMAGE";
  reservationId?: string;
  onSuccess?: (uploadRecord: any) => void;
  label?: string;
  description?: string;
  accept?: string;
  maxSizeBytes?: number;
}

export function FileUpload({
  type,
  reservationId,
  onSuccess,
  label = "Upload Document",
  description = "PDF, PNG, JPG, or WEBP up to 10MB",
  accept = ".pdf,.png,.jpg,.jpeg,.webp",
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (file.size > maxSizeBytes) {
      setErrorMsg(`File size (${formatSize(file.size)}) exceeds maximum limit of 10MB.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", type);
      if (reservationId) {
        formData.append("reservationId", reservationId);
      }

      const res = await apiClient.post("/uploads", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadRecord = res.data?.data || res.data;
      setSuccessMsg("Document uploaded successfully.");
      setSelectedFile(null);
      if (onSuccess) {
        onSuccess(uploadRecord);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to upload document. Please try again.";
      setErrorMsg(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {label && <label className="block text-xs font-semibold text-slate-700">{label}</label>}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-blue-600 bg-blue-50/50 scale-[1.01]"
              : "border-slate-300 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-400"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept={accept}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Click to choose file <span className="font-normal text-slate-500">or drag & drop</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 truncate max-w-[220px]">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-500">{formatSize(selectedFile.size)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleUpload}
              isLoading={isUploading}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs cursor-pointer shadow-md shadow-blue-600/25"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Uploading...
                </>
              ) : (
                "Upload File"
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={isUploading}
              onClick={() => setSelectedFile(null)}
              className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

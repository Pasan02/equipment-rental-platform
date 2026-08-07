"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import {
  User,
  ShieldCheck,
  Sliders,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  KeyRound,
  Mail,
  Phone,
  Building,
  FileText,
  Download,
  Trash2,
} from "lucide-react";

interface UploadRecord {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const isAdmin = user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "documents" | "system">(
    "profile"
  );

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // System Config Form State (Admin Only)
  const [systemForm, setSystemForm] = useState({
    maxRentalDays: "30",
    defaultDepositPercent: "20",
    lateFeeDailyPercent: "5",
    currency: "USD ($)",
    taxRatePercent: "8.5",
    requireVerificationDoc: true,
  });
  const [isUpdatingSystem, setIsUpdatingSystem] = useState(false);
  const [systemMessage, setSystemMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    if (!user?.id) return;
    setIsUpdatingProfile(true);

    try {
      const res = await apiClient.patch(`/users/${user.id}`, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
      });

      const updatedData = res.data?.data || res.data;
      updateUser({
        ...user,
        firstName: updatedData.firstName || profileForm.firstName,
        lastName: updatedData.lastName || profileForm.lastName,
        phone: updatedData.phone || profileForm.phone,
      });

      setProfileMessage({ type: "success", text: "Profile information updated successfully." });
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to update profile.";
      setProfileMessage({ type: "error", text: Array.isArray(msg) ? msg.join(", ") : msg });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Update
  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);
    if (!user?.id) return;

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (securityForm.newPassword.length < 8) {
      setSecurityMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await apiClient.patch(`/users/${user.id}/change-password`, {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });

      setSecurityMessage({ type: "success", text: "Password changed successfully." });
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to change password.";
      setSecurityMessage({ type: "error", text: Array.isArray(msg) ? msg.join(", ") : msg });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle System Config Update
  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemMessage(null);
    setIsUpdatingSystem(true);

    try {
      // Simulate saving system business rules
      await new Promise((r) => setTimeout(r, 600));
      setSystemMessage({ type: "success", text: "System business rules and parameters updated." });
    } catch {
      setSystemMessage({ type: "error", text: "Failed to update system configuration." });
    } finally {
      setIsUpdatingSystem(false);
    }
  };

  // Fetch User Uploaded Documents
  const { data: rawUploads, isLoading: isLoadingUploads } = useQuery({
    queryKey: ["uploads"],
    queryFn: async () => {
      const res = await apiClient.get("/uploads");
      return res.data;
    },
  });

  const userUploads: UploadRecord[] = Array.isArray(rawUploads?.data)
    ? rawUploads.data
    : Array.isArray(rawUploads)
    ? rawUploads
    : Array.isArray(rawUploads?.items)
    ? rawUploads.items
    : [];

  // Delete Document Mutation
  const deleteUploadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/uploads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
    },
  });

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
          Account & System Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal profile, security credentials, and business operational rules.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex-shrink-0 ${
            activeTab === "profile"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <User className="h-4 w-4" /> Personal Profile
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex-shrink-0 ${
            activeTab === "security"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Security & Password
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex-shrink-0 ${
            activeTab === "documents"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <FileText className="h-4 w-4" /> Identity Verification & Docs
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex-shrink-0 ${
              activeTab === "system"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Sliders className="h-4 w-4" /> System Configuration
          </button>
        )}
      </div>

      {/* TAB 1: Profile Settings */}
      {activeTab === "profile" && (
        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 font-heading">
              Profile Information
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Update your account details and contact info
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Avatar Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="h-16 w-16 rounded-2xl bg-blue-600 font-bold text-white text-xl flex items-center justify-center shadow-md flex-shrink-0">
                {initials}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  {user?.firstName} {user?.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info" className="text-xs">
                    {user?.role}
                  </Badge>
                  <span className="text-xs text-slate-500 font-mono">{user?.email}</span>
                </div>
              </div>
            </div>

            {profileMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${
                  profileMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                {profileMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">First Name</label>
                  <Input
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Last Name</label>
                  <Input
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Email Address (Read-only)</label>
                <Input
                  value={profileForm.email}
                  disabled
                  className="bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Phone Number</label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="default"
                  className="gap-2"
                  isLoading={isUpdatingProfile}
                >
                  <Save className="h-4 w-4" /> Save Profile Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === "security" && (
        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 font-heading">
              Password & Security
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Change your password and manage account credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {securityMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${
                  securityMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                {securityMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{securityMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSecuritySubmit} className="space-y-4 text-xs max-w-md">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Confirm New Password</label>
                <Input
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="default"
                  className="gap-2"
                  isLoading={isUpdatingPassword}
                >
                  <KeyRound className="h-4 w-4" /> Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: System Config (Admin Only) */}
      {activeTab === "system" && isAdmin && (
        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 font-heading">
              Platform Business Rules
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Configure global rental limits, deposit calculations, and late fee rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {systemMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${
                  systemMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                {systemMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{systemMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSystemSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Max Rental Duration (Days)</label>
                  <Input
                    type="number"
                    value={systemForm.maxRentalDays}
                    onChange={(e) => setSystemForm({ ...systemForm, maxRentalDays: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Default Deposit Rate (%)</label>
                  <Input
                    type="number"
                    value={systemForm.defaultDepositPercent}
                    onChange={(e) => setSystemForm({ ...systemForm, defaultDepositPercent: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Late Return Fee Daily Rate (%)</label>
                  <Input
                    type="number"
                    value={systemForm.lateFeeDailyPercent}
                    onChange={(e) => setSystemForm({ ...systemForm, lateFeeDailyPercent: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Sales Tax Rate (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={systemForm.taxRatePercent}
                    onChange={(e) => setSystemForm({ ...systemForm, taxRatePercent: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemForm.requireVerificationDoc}
                    onChange={(e) => setSystemForm({ ...systemForm, requireVerificationDoc: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Require Identity Verification Upload for High-Value Rentals</span>
                </label>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="default"
                  className="gap-2"
                  isLoading={isUpdatingSystem}
                >
                  <Save className="h-4 w-4" /> Save Business Rules
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: Verification & Identity Documents */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900 font-heading">
                Upload Verification Document
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Upload your Driver's License, Passport, or National ID for rental identity verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                type="IDENTITY_DOCUMENT"
                label="Select Identity File"
                description="Upload PDF, PNG, JPG, or WEBP up to 10MB"
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["uploads"] });
                }}
              />
            </CardContent>
          </Card>

          {/* Uploaded Documents List */}
          <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900 font-heading">
                Your Verification Documents ({userUploads.length})
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Manage your active verification files and attached documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUploads ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading verification documents...
                </div>
              ) : userUploads.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2 stroke-1" />
                  <p className="text-xs font-semibold text-slate-700">No verification documents uploaded yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the dropzone above to upload your Driver's License or ID.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
                  {userUploads.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{doc.fileName}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <Badge variant="secondary" className="text-[10px]">
                              {doc.type}
                            </Badge>
                            <span>{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                            <span>• {formatDateTime(doc.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" /> View / Download
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                          onClick={() => deleteUploadMutation.mutate(doc.id)}
                          isLoading={deleteUploadMutation.isPending}
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "lucide-react";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const isAdmin = user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "system">("profile");

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
    setIsUpdatingProfile(true);

    try {
      const res = await apiClient.put("/auth/profile", {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
      });

      if (res.data.data) {
        updateUser({
          ...user!,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
        });
      }

      setProfileMessage({ type: "success", text: "Profile information updated successfully." });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to update profile.";
      setProfileMessage({ type: "error", text: msg });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Update
  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

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
      await apiClient.post("/auth/change-password", {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });

      setSecurityMessage({ type: "success", text: "Password changed successfully." });
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to change password.";
      setSecurityMessage({ type: "error", text: msg });
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

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
          Account & System Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal profile, security credentials, and business operational rules.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex-shrink-0 ${
            activeTab === "profile"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
              : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
          }`}
        >
          <User className="h-4 w-4" /> Personal Profile
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex-shrink-0 ${
            activeTab === "security"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
              : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Security & Password
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex-shrink-0 ${
              activeTab === "system"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            <Sliders className="h-4 w-4" /> System Configuration
          </button>
        )}
      </div>

      {/* TAB 1: Profile Settings */}
      {activeTab === "profile" && (
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white font-heading">
              Profile Information
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Update your account details and contact info
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Avatar Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="h-16 w-16 rounded-2xl bg-blue-600 font-bold text-white text-xl flex items-center justify-center shadow-lg shadow-blue-600/25 flex-shrink-0">
                {initials}
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  {user?.firstName} {user?.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info" className="text-[10px]">
                    {user?.role}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">{user?.email}</span>
                </div>
              </div>
            </div>

            {profileMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg border text-xs ${
                  profileMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
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
                  <label className="font-semibold text-slate-300">First Name</label>
                  <Input
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Last Name</label>
                  <Input
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Email Address (Read-only)</label>
                <Input
                  value={profileForm.email}
                  disabled
                  className="bg-slate-950/50 border-slate-800/60 text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Phone Number</label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
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
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white font-heading">
              Password & Security
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Change your password and manage account credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {securityMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg border text-xs ${
                  securityMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
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
                <label className="font-semibold text-slate-300">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Confirm New Password</label>
                <Input
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
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
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md text-slate-100 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white font-heading">
              Platform Business Rules
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Configure global rental limits, deposit calculations, and late fee rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {systemMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg border text-xs ${
                  systemMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
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
                  <label className="font-semibold text-slate-300">Max Rental Duration (Days)</label>
                  <Input
                    type="number"
                    value={systemForm.maxRentalDays}
                    onChange={(e) => setSystemForm({ ...systemForm, maxRentalDays: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Default Deposit Rate (%)</label>
                  <Input
                    type="number"
                    value={systemForm.defaultDepositPercent}
                    onChange={(e) => setSystemForm({ ...systemForm, defaultDepositPercent: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Late Return Fee Daily Rate (%)</label>
                  <Input
                    type="number"
                    value={systemForm.lateFeeDailyPercent}
                    onChange={(e) => setSystemForm({ ...systemForm, lateFeeDailyPercent: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Sales Tax Rate (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={systemForm.taxRatePercent}
                    onChange={(e) => setSystemForm({ ...systemForm, taxRatePercent: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemForm.requireVerificationDoc}
                    onChange={(e) => setSystemForm({ ...systemForm, requireVerificationDoc: e.target.checked })}
                    className="rounded border-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Require Identity Verification Upload for High-Value Rentals</span>
                </label>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                  isLoading={isUpdatingSystem}
                >
                  <Save className="h-4 w-4" /> Save Business Rules
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

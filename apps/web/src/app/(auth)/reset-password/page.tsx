"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Lock, ArrowLeft } from "lucide-react";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setErrorMsg("Reset token is missing from URL. Please request a new password reset link.");
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      await apiClient.post("/auth/reset-password", {
        token,
        newPassword: values.newPassword,
      });

      setIsSuccess(true);
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to reset password. The link may have expired or is invalid.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl text-slate-100 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-white">Invalid Reset Link</CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            No valid security token was found in the URL request.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pt-2">
          <Link href="/forgot-password">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              Request New Reset Link
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl text-slate-100 shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold font-heading text-white">Set New Password</CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Enter your new password below to update your security credentials
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isSuccess ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-5 text-center space-y-3 animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">Password Updated</h4>
            <p className="text-xs text-slate-300">
              Your password has been successfully updated. All active sessions have been revoked.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-2"
            >
              Sign In with New Password
            </Button>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 animate-fade-in">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    {...register("newPassword")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                    error={errors.newPassword?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    {...register("confirmPassword")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                    error={errors.confirmPassword?.message}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 mt-2"
                isLoading={isLoading}
              >
                Reset Password
              </Button>
            </form>
          </>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t border-slate-800/80 pt-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-400 text-sm">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

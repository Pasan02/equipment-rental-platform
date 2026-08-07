"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Lock, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const isRegistered = searchParams.get("registered") === "true";
  const reason = searchParams.get("reason");

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/login", values);
      const { user, accessToken, refreshToken } = response.data.data;

      setAuth(user, accessToken, refreshToken);
      const targetPath =
        user.role === "WAREHOUSE" && (redirect === "/dashboard" || !redirect)
          ? "/inventory"
          : redirect;
      router.push(targetPath);
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Invalid email or password. Please try again.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white text-slate-900 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold font-heading text-slate-900">Welcome back</CardTitle>
        <CardDescription className="text-slate-500 text-sm">
          Enter your credentials to access your rental dashboard
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Banner Alerts */}
        {isRegistered && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Registration successful! Please sign in with your account.</span>
          </div>
        )}

        {reason === "expired" && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Your session has expired. Please log in again.</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 animate-fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                {...register("email")}
                type="email"
                placeholder="name@example.com"
                className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                error={errors.email?.message}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 pr-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm mt-2"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-400 text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

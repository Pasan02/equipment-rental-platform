"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Mail, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", values);
      setIsSubmitted(true);
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "An unexpected error occurred. Please try again.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl text-slate-100 shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold font-heading text-white">Reset Password</CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Enter your email address and we&apos;ll send you instructions to reset your password
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isSubmitted ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-5 text-center space-y-3 animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">Check your email</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              If an account exists with that email address, password reset instructions have been dispatched to your inbox.
            </p>
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
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="name@example.com"
                    className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                    error={errors.email?.message}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 mt-2"
                isLoading={isLoading}
              >
                Send Reset Link
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

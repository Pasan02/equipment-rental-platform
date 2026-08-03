import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Cpu, PackageCheck, Layers, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
              ER
            </div>
            <span className="text-lg font-bold font-heading tracking-tight text-white">EquipRent</span>
            <Badge variant="info" className="ml-2">v1.0 Foundation</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-8 backdrop-blur-sm">
            <Cpu className="h-3.5 w-3.5" /> Next.js App Router & Tailwind CSS Foundation Active
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-heading max-w-4xl mx-auto leading-tight text-white">
            Streamlined Management for Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Equipment Rentals</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto font-normal">
            Real-time reservations, intelligent warehouse inventory tracking, automated background jobs, and powerful analytics built on Next.js 16 and NestJS.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 gap-2">
                Access Platform <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white gap-2">
                <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
              </Button>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
            <div className="glass-card rounded-xl p-6 border border-slate-800 bg-slate-900/50">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white font-heading">RBAC Authentication</h3>
              <p className="mt-2 text-sm text-slate-400">
                JWT auth with automated token rotation interceptor and role-based route middleware protection.
              </p>
            </div>
            <div className="glass-card rounded-xl p-6 border border-slate-800 bg-slate-900/50">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                <PackageCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white font-heading">TanStack Query Caching</h3>
              <p className="mt-2 text-sm text-slate-400">
                Optimistic updates, automatic cache revalidation, and background data synchronization.
              </p>
            </div>
            <div className="glass-card rounded-xl p-6 border border-slate-800 bg-slate-900/50">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white font-heading">Zustand State Engine</h3>
              <p className="mt-2 text-sm text-slate-400">
                Lightweight, reactive client-side store managing user identity, tokens, and active sessions.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>© 2026 EquipRent Platform. Built with Next.js App Router, Tailwind CSS, & NestJS.</p>
      </footer>
    </div>
  );
}

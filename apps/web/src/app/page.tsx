import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Cpu, PackageCheck, Layers, LayoutDashboard, Building2, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Header Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-600/20">
              ER
            </div>
            <span className="text-lg font-bold font-heading tracking-tight text-slate-900">
              Equip<span className="text-blue-600">Rent</span>
            </span>
            <Badge variant="default" className="ml-2 hidden sm:inline-flex">
              Enterprise Platform
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="default">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 mb-8 shadow-xs">
            <Building2 className="h-3.5 w-3.5" /> Streamlined Equipment Rental & Warehouse Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-heading max-w-4xl mx-auto leading-tight text-slate-900">
            Professional Equipment Rental <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
              Management Simplified
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Real-time reservations, intelligent warehouse inventory tracking, automated email notifications, and comprehensive financial reporting.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" variant="default" className="shadow-md shadow-blue-600/20">
                Access Platform <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="gap-2">
                <LayoutDashboard className="h-4 w-4 text-blue-600" /> View Dashboard
              </Button>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
            <div className="glass-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">Role-Based Access Control</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Multi-tier authorization guarding Admin, Staff, Warehouse, and Customer routes with automated token rotation.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <PackageCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">Real-Time Inventory</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Warehouse stock metrics tracking stock receive, release, damage fee reports, and maintenance states.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">Reservation Workflows</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                State machine workflow guiding reservations from pending request to approval, pickup activation, and return.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>© 2026 EquipRent Platform. Built with Next.js App Router, Tailwind CSS, & NestJS.</p>
      </footer>
    </div>
  );
}




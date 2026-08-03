import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Subtle Ambient Glow Shapes */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Auth Header Logo */}
      <header className="pt-8 text-center z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 group cursor-pointer">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            ER
          </div>
          <span className="text-2xl font-extrabold font-heading tracking-tight text-white">
            EquipRent
          </span>
        </Link>
      </header>

      {/* Main Centered Content Container */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Auth Footer */}
      <footer className="pb-6 text-center text-xs text-slate-500 z-10">
        <p>© 2026 EquipRent Platform. Secure Enterprise Equipment Management.</p>
      </footer>
    </div>
  );
}

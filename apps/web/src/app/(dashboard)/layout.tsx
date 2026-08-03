"use client";

import { useState, ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Sidebar (Desktop Fixed + Mobile Drawer) */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Layout Area (Shifted right by 16rem/w-64 on desktop) */}
      <div className="flex flex-1 flex-col md:pl-64 transition-all duration-200 min-h-screen">
        <Header onMobileMenuToggle={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-slate-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}


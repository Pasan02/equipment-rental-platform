"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Camera,
  Calendar,
  Users,
  Boxes,
  CreditCard,
  Settings,
  X,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Equipment",
    href: "/equipment",
    icon: Camera,
  },
  {
    title: "Reservations",
    href: "/reservations",
    icon: Calendar,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Boxes,
    roles: ["ADMIN", "STAFF", "WAREHOUSE"],
  },
  {
    title: "Payments",
    href: "/payments",
    icon: CreditCard,
    roles: ["ADMIN", "STAFF"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || "CUSTOMER";

  // Filter links based on user role
  const filteredNavItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-200 border-r border-slate-800">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2.5 cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-md shadow-blue-500/20">
              ER
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold font-heading text-white tracking-tight leading-none">
                EquipRent
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                Management Platform
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 p-4">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Navigation
          </div>
          {filteredNavItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Logged in as</span>
              <span className="text-xs font-semibold text-white">{user?.firstName || "User"}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] bg-slate-900 text-slate-300 border-slate-700">
            {userRole}
          </Badge>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Drawer Overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-full shadow-2xl animate-fade-in z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

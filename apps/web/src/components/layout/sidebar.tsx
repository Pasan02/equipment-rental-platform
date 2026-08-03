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
  Shield,
  ChevronRight,
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
    <div className="flex h-full flex-col justify-between bg-white text-slate-800 border-r border-slate-200">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-600/20">
              ER
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold font-heading text-slate-900 tracking-tight leading-none">
                Equip<span className="text-blue-600">Rent</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight mt-1">
                Rental Management
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 p-3 mt-2">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu
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
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer group",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                  <span>{item.title}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-blue-600" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role Footer Info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/60">
        <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold">
              {user?.firstName?.[0] || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Signed in as</span>
              <span className="text-xs font-semibold text-slate-900 truncate max-w-[100px]">{user?.firstName || "User"}</span>
            </div>
          </div>
          <Badge variant="default" className="text-[10px]">
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
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




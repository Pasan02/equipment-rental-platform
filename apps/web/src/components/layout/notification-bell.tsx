"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Inbox, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications/unread-count");
      return res.data.data as { count: number };
    },
    refetchInterval: 30000, // Refetch every 30s
  });

  // Fetch recent notifications list when popover is open
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications?pageSize=5");
      return res.data.data as { items: NotificationItem[] };
    },
    enabled: isOpen,
  });

  // Mark single notification read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = unreadData?.count || 0;
  const notifications = notificationsData?.items || [];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
              {unreadCount > 0 && (
                <Badge variant="warning" className="text-[10px] px-2 py-0">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="flex items-center justify-center p-8 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Inbox className="h-8 w-8 mb-2 stroke-1" />
                <p className="text-sm font-medium text-slate-600">No notifications yet</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 transition-colors flex items-start gap-3 ${
                    item.isRead ? "bg-transparent opacity-75" : "bg-blue-50/50"
                  } hover:bg-slate-50`}
                >
                  <div
                    className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                      item.isRead ? "bg-transparent" : "bg-blue-600"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  {!item.isRead && (
                    <button
                      onClick={() => markReadMutation.mutate(item.id)}
                      title="Mark as read"
                      className="text-slate-400 hover:text-blue-600 transition-colors p-1 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


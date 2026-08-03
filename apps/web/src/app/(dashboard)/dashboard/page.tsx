import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutDashboard, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back! Here is a summary of your equipment rental management platform.
          </p>
        </div>
        <Badge variant="success" className="w-fit gap-1 text-xs py-1 px-3">
          <CheckCircle2 className="h-3.5 w-3.5" /> Subtask 5.2 Layout Active
        </Badge>
      </div>

      <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Dashboard Layout & Navigation Shell</CardTitle>
              <CardDescription className="text-slate-400">
                Responsive sidebar, dynamic breadcrumbs, unread notification bell, and user navigation menu ready.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 font-mono">
            Navigation shell loaded via src/app/(dashboard)/layout.tsx
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

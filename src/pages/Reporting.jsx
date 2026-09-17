import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MaintenanceTask, MaintenanceTeam, Store } from "@/api/entities";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, differenceInHours } from "date-fns";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Wrench, Clock, Activity, CheckCircle2, AlertTriangle, TrendingUp, BarChart2, Download,
} from "lucide-react";

const SLA_HOURS = {
  civil: 96, electrical: 96, cooling: 24, plumbing: 96,
  equipment: 48, generator: 48, firefighting: 24,
};
const DEFAULT_SLA_HOURS = 96;

const COLORS = ["#FFB800", "#005F61", "#1A1A1C", "#dc2626", "#a1a1a1", "#3b82f6", "#8b5cf6", "#f97316"];

const chartTooltipStyle = {
  contentStyle: {
    border: "2px solid #1A1A1C",
    borderRadius: 0,
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    backgroundColor: "hsl(40 7% 97%)",
  },
};

function ChartCard({ title, children, className }) {
  return (
    <div className={cn("border-2 border-border p-5", className)}>
      <div className="font-mono text-xs tracking-[0.2em] text-muted-foreground mb-4">{title}</div>
      {children}
    </div>
  );
}

export default function Reporting() {
  const [exporting, setExporting] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["reporting-tasks"],
    queryFn: () => MaintenanceTask.list("-created_date", 5000),
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => MaintenanceTeam.list(),
  });
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => Store.list("store_code"),
  });

  const isLoading = tasksLoading;

  const stats = useMemo(() => {
    const total = tasks.length;
    const assigned = tasks.filter(t => t.status === "assigned").length;
    const onHold = tasks.filter(t => t.status === "on_hold").length;
    const resolved = tasks.filter(t => t.status === "resolved").length;
    const critical = tasks.filter(t => t.priority === "critical" && t.status !== "resolved").length;

    const resolvedWithDates = tasks.filter(t => t.status === "resolved" && t.resolved_date && t.created_date);
    const avgResHours = resolvedWithDates.length
      ? Math.round(
          resolvedWithDates.reduce((sum, t) => sum + differenceInHours(new Date(t.resolved_date), new Date(t.created_date)), 0) /
          resolvedWithDates.length
        )
      : null;

    const slaEvaluated = resolvedWithDates.map(t => {
      const sla = SLA_HOURS[t.category] ?? DEFAULT_SLA_HOURS;
      const hours = differenceInHours(new Date(t.resolved_date), new Date(t.created_date));
      return { withinSLA: hours <= sla, category: t.category, delay: Math.max(0, hours - sla) };
    });
    const slaRate = slaEvaluated.length
      ? Math.round((slaEvaluated.filter(e => e.withinSLA).length / slaEvaluated.length) * 100)
      : null;

    const byCategory = {};
    tasks.forEach(t => {
      const key = t.category || "unknown";
      byCategory[key] ??= { category: key, open: 0, resolved: 0 };
      if (t.status === "resolved") byCategory[key].resolved++;
      else byCategory[key].open++;
    });

    const byStatus = ["assigned", "on_hold", "resolved"].map(status => ({
      status: status.replace("_", " ").toUpperCase(),
      count: tasks.filter(t => t.status === status).length,
    }));

    const byPriority = ["critical", "high", "medium", "low"].map(priority => ({
      name: priority.toUpperCase(),
      value: tasks.filter(t => t.priority === priority).length,
    })).filter(p => p.value > 0);

    const byTeam = {};
    teams.forEach(team => {
      byTeam[team.name] = { team: team.name, assigned: 0, resolved: 0 };
    });
    tasks.forEach(t => {
      if (!t.assigned_team_name) return;
      byTeam[t.assigned_team_name] ??= { team: t.assigned_team_name, assigned: 0, resolved: 0 };
      if (t.status === "resolved") byTeam[t.assigned_team_name].resolved++;
      else byTeam[t.assigned_team_name].assigned++;
    });
    const teamWorkload = Object.values(byTeam)
      .map(t => ({ ...t, total: t.assigned + t.resolved }))
      .sort((a, b) => b.total - a.total);

    const byRegion = {};
    tasks.forEach(t => {
      const store = stores.find(s => s.id === t.store_id);
      const region = store?.region || "Unknown";
      byRegion[region] = (byRegion[region] || 0) + 1;
    });
    const regionData = Object.entries(byRegion).map(([region, count]) => ({ region, count }));

    const byStoreId = {};
    tasks.forEach(t => {
      byStoreId[t.store_id] ??= { store: `${t.store_code || ""}`.trim() || "Unknown", count: 0 };
      byStoreId[t.store_id].count++;
    });
    const topStores = Object.values(byStoreId).sort((a, b) => b.count - a.count).slice(0, 10);

    const byMonth = {};
    tasks.forEach(t => {
      if (!t.created_date) return;
      const key = format(new Date(t.created_date), "MMM yy");
      byMonth[key] ??= { month: key, received: 0, resolved: 0 };
      byMonth[key].received++;
      if (t.status === "resolved") byMonth[key].resolved++;
    });
    const monthData = Object.values(byMonth).sort(
      (a, b) => new Date(`01 ${a.month}`) - new Date(`01 ${b.month}`)
    );

    const slaByCat = Object.keys(SLA_HOURS).map(category => {
      const evaluated = slaEvaluated.filter(e => e.category === category);
      const within = evaluated.filter(e => e.withinSLA).length;
      const breached = evaluated.length - within;
      return {
        category, slaHours: SLA_HOURS[category], closed: evaluated.length,
        within, breached,
        rate: evaluated.length ? Math.round((within / evaluated.length) * 100) : null,
      };
    });

    return {
      total, assigned, onHold, resolved, critical, avgResHours, slaRate,
      byCategory: Object.values(byCategory), byStatus, byPriority,
      teamWorkload, regionData, topStores, monthData, slaByCat,
    };
  }, [tasks, teams, stores]);

  const handleExport = () => {
    setExporting(true);
    try {
      const detailRows = tasks.map(t => {
        const hours = t.resolved_date && t.created_date
          ? differenceInHours(new Date(t.resolved_date), new Date(t.created_date))
          : null;
        const sla = SLA_HOURS[t.category] ?? DEFAULT_SLA_HOURS;
        const store = stores.find(s => s.id === t.store_id);
        return {
          "Task Code": t.task_code, "Date": t.created_date ? format(new Date(t.created_date), "dd/MM/yyyy HH:mm") : "",
          "Title": t.title, "Description": t.description,
          "Category": t.category, "Sub-Category": t.sub_category, "Sub-Location": t.sub_location,
          "Priority": t.priority, "Status": t.status,
          "Store Code": t.store_code, "Store Name": t.store_name, "Region": store?.region ?? "",
          "Manager Name": store?.contact_name ?? "", "Manager Phone": store?.contact_phone ?? "",
          "Team": t.assigned_team_name,
          "Assigned Date": t.assigned_date ? format(new Date(t.assigned_date), "dd/MM/yyyy HH:mm") : "",
          "Resolved Date": t.resolved_date ? format(new Date(t.resolved_date), "dd/MM/yyyy HH:mm") : "",
          "Resolution Time (h)": hours ?? "",
          "SLA Limit (h)": sla,
          "Within SLA": hours !== null ? (hours <= sla ? "Yes" : "No") : "",
          "Delay (h)": hours !== null ? Math.max(0, hours - sla) : "",
          "Escalation Level": t.escalation_level ?? 0,
          "Requested By": t.created_by,
        };
      });
      const detailSheet = XLSX.utils.json_to_sheet(detailRows);
      detailSheet["!cols"] = Object.keys(detailRows[0] || {}).map(() => ({ wch: 18 }));

      const summaryRows = [
        ["MaintOps Report", format(new Date(), "dd/MM/yyyy HH:mm")],
        [],
        ["Overview"],
        ["Total Requests", stats.total],
        ["Assigned", stats.assigned],
        ["On Hold", stats.onHold],
        ["Resolved", stats.resolved],
        ["Critical Active", stats.critical],
        ["Avg Resolution (h)", stats.avgResHours ?? "N/A"],
        ["SLA Compliance", stats.slaRate !== null ? `${stats.slaRate}%` : "N/A"],
        [],
        ["By Category", "Open", "Resolved"],
        ...stats.byCategory.map(c => [c.category, c.open, c.resolved]),
        [],
        ["Team Workload", "Assigned", "Resolved"],
        ...stats.teamWorkload.map(t => [t.team, t.assigned, t.resolved]),
        [],
        ["Top Stores", "Requests"],
        ...stats.topStores.map(s => [s.store, s.count]),
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, detailSheet, "Maintenance Requests");
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
      XLSX.writeFile(wb, `MaintOps_Report_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
          {Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-28 border-2 border-border" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px]">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-1">
            ANALYTICS · REPORTING
          </div>
          <h1 className="font-display font-black text-3xl lg:text-4xl tracking-tight">
            OPERATIONAL REPORTS
          </h1>
        </div>
        <Button onClick={handleExport} disabled={exporting} className="bg-foreground text-background hover:bg-foreground/90 font-display font-bold tracking-wider">
          <Download className="w-4 h-4 mr-2" /> {exporting ? "EXPORTING..." : "EXPORT TO EXCEL"}
        </Button>
      </div>

      {/* KPI cards — single grid so it wraps 5 + 2, matching the original layout */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-0 mb-10">
        <KPI label="TOTAL REQUESTS" value={stats.total} icon={Wrench} />
        <KPI label="ASSIGNED" value={stats.assigned} icon={Clock} accent={stats.assigned > 0} />
        <KPI label="ON HOLD" value={stats.onHold} icon={Activity} accent={stats.onHold > 0} />
        <KPI label="RESOLVED" value={stats.resolved} icon={CheckCircle2} />
        <KPI label="CRITICAL ACTIVE" value={stats.critical} icon={AlertTriangle} accent={stats.critical > 0} />
        <KPI label="AVG RESOLUTION" value={stats.avgResHours !== null ? `${stats.avgResHours}h` : "N/A"} icon={TrendingUp} />
        <KPI label="SLA COMPLIANCE" value={stats.slaRate !== null ? `${stats.slaRate}%` : "N/A"} icon={BarChart2} accent={stats.slaRate !== null && stats.slaRate < 80} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 mb-4">
        <ChartCard title="RECEIVED VS RESOLVED">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Line type="monotone" dataKey="received" stroke="#FFB800" strokeWidth={2} name="Received" />
              <Line type="monotone" dataKey="resolved" stroke="#005F61" strokeWidth={2} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="REQUESTS BY CATEGORY">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Bar dataKey="open" stackId="a" fill="#FFB800" name="Open" />
              <Bar dataKey="resolved" stackId="a" fill="#005F61" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 mb-4">
        <ChartCard title="REQUESTS BY STATUS">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.byStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <YAxis type="category" dataKey="status" width={90} tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" fill="#005F61" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="TEAM WORKLOAD">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.teamWorkload}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="team" tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Bar dataKey="assigned" stackId="a" fill="#FFB800" name="Assigned" />
              <Bar dataKey="resolved" stackId="a" fill="#005F61" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 mb-10">
        <ChartCard title="PRIORITY DISTRIBUTION">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.byPriority} dataKey="value" nameKey="name" outerRadius={80} strokeWidth={2}>
                {stats.byPriority.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="REQUESTS BY REGION">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.regionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="region" tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" fill="#1A1A1C" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SLA COMPLIANCE BY CATEGORY">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.slaByCat}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Bar dataKey="within" stackId="a" fill="#005F61" name="Within SLA" />
              <Bar dataKey="breached" stackId="a" fill="#dc2626" name="Breached" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="TOP 10 STORES BY REQUEST VOLUME" className="mb-10">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={stats.topStores} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
            <YAxis type="category" dataKey="store" width={160} tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="count" fill="#FFB800" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Tables */}
      <div className="mb-4">
        <div className="font-mono text-xs tracking-[0.2em] text-muted-foreground mb-3">TEAM PERFORMANCE</div>
        <div className="border-2 border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border font-mono text-xs text-muted-foreground">
                <th className="text-left p-3">TEAM</th>
                <th className="text-right p-3">TOTAL ASSIGNED</th>
                <th className="text-right p-3">OPEN / ON HOLD</th>
                <th className="text-right p-3">RESOLVED</th>
                <th className="text-right p-3">RESOLUTION RATE</th>
              </tr>
            </thead>
            <tbody>
              {stats.teamWorkload.map(t => {
                const rate = t.total ? Math.round((t.resolved / t.total) * 100) : 0;
                return (
                  <tr key={t.team} className="border-b border-border last:border-0">
                    <td className="p-3 font-display font-bold">{t.team}</td>
                    <td className="p-3 text-right font-mono">{t.total}</td>
                    <td className="p-3 text-right font-mono text-amber">{t.assigned}</td>
                    <td className="p-3 text-right font-mono text-teal">{t.resolved}</td>
                    <td className={cn(
                      "p-3 text-right font-mono font-bold",
                      rate >= 80 ? "text-teal" : rate >= 50 ? "text-amber" : "text-destructive"
                    )}>
                      {rate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="font-mono text-xs tracking-[0.2em] text-muted-foreground mb-3">SLA PERFORMANCE DETAIL</div>
        <div className="border-2 border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border font-mono text-xs text-muted-foreground">
                <th className="text-left p-3">CATEGORY</th>
                <th className="text-right p-3">SLA LIMIT</th>
                <th className="text-right p-3">CLOSED</th>
                <th className="text-right p-3">WITHIN SLA</th>
                <th className="text-right p-3">BREACHED</th>
                <th className="text-right p-3">COMPLIANCE RATE</th>
              </tr>
            </thead>
            <tbody>
              {stats.slaByCat.map(c => (
                <tr key={c.category} className="border-b border-border last:border-0">
                  <td className="p-3 font-display font-bold uppercase">{c.category}</td>
                  <td className="p-3 text-right font-mono">{c.slaHours}h</td>
                  <td className="p-3 text-right font-mono">{c.closed}</td>
                  <td className="p-3 text-right font-mono text-teal">{c.within}</td>
                  <td className="p-3 text-right font-mono text-destructive">{c.breached}</td>
                  <td className={cn(
                    "p-3 text-right font-mono font-bold",
                    c.rate === null ? "text-muted-foreground" : c.rate >= 80 ? "text-teal" : "text-destructive"
                  )}>
                    {c.rate !== null ? `${c.rate}%` : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, accent }) {
  return (
    <div className={cn(
      "border-2 p-6 flex flex-col gap-2",
      accent ? "border-amber bg-amber/5" : "border-border bg-card"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">{label}</span>
        {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
      </div>
      <span className="text-3xl font-display font-black tracking-tight">{value}</span>
    </div>
  );
}

/**
 * Notification Analytics Dashboard (Admin)
 *
 * Shows real-time stats on the AI notification system:
 * - Total sent, click-through rate per A/B variant
 * - Top categories driving engagement
 * - Re-engagement vs proximity vs lifecycle breakdown
 * - User engagement health score over time
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  BrainCircuit, TrendingUp, MousePointerClick, Send,
  Zap, Target, RefreshCcw, BarChart2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ── Types ──────────────────────────────────────────────────────────────────
interface NotifLog {
  id: string;
  trigger_type: string;
  variant: string;
  clicked: boolean;
  sent_at: string;
  task_id: string | null;
  tasks?: { category: string } | null;
}

interface VariantStat {
  variant: string;
  sent: number;
  clicked: number;
  ctr: number;
}

interface CategoryStat {
  category: string;
  sent: number;
  clicked: number;
  ctr: number;
}

interface TriggerStat {
  name: string;
  value: number;
  fill: string;
}

const VARIANT_COLORS: Record<string, string> = {
  formal: '#6366f1',
  emoji: '#f59e0b',
  urgent: '#ef4444',
  personalized: '#10b981',
};

const TRIGGER_COLORS: Record<string, string> = {
  proximity: '#6366f1',
  're-engagement': '#f59e0b',
  lifecycle: '#10b981',
};

const formatPct = (n: number) => `${n.toFixed(1)}%`;

// ── Main Component ─────────────────────────────────────────────────────────
export default function NotificationAnalytics() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Guard: admin only
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/');
    }
  }, [profile, navigate]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*, tasks(category)')
        .order('sent_at', { ascending: false })
        .limit(2000);

      if (!error && data) {
        setLogs(data as NotifLog[]);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('[NotificationAnalytics] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  // ── Derived Stats ─────────────────────────────────────────────────────
  const totalSent = logs.length;
  const totalClicked = logs.filter((l) => l.clicked).length;
  const overallCTR = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

  // By variant
  const variantStats: VariantStat[] = ['formal', 'emoji', 'urgent', 'personalized'].map((v) => {
    const vs = logs.filter((l) => l.variant === v);
    const clicked = vs.filter((l) => l.clicked).length;
    return { variant: v, sent: vs.length, clicked, ctr: vs.length > 0 ? (clicked / vs.length) * 100 : 0 };
  }).filter((v) => v.sent > 0);

  // Best variant
  const bestVariant = [...variantStats].sort((a, b) => b.ctr - a.ctr)[0];

  // By trigger type
  const triggerStats: TriggerStat[] = ['proximity', 're-engagement', 'lifecycle'].map((t) => ({
    name: t,
    value: logs.filter((l) => l.trigger_type === t).length,
    fill: TRIGGER_COLORS[t] || '#888',
  })).filter((t) => t.value > 0);

  // By category
  const catMap: Record<string, { sent: number; clicked: number }> = {};
  logs.forEach((l) => {
    const cat = l.tasks?.category || 'unknown';
    if (!catMap[cat]) catMap[cat] = { sent: 0, clicked: 0 };
    catMap[cat].sent++;
    if (l.clicked) catMap[cat].clicked++;
  });
  const categoryStats: CategoryStat[] = Object.entries(catMap)
    .map(([category, { sent, clicked }]) => ({
      category: category.replace(/_/g, ' '),
      sent,
      clicked,
      ctr: sent > 0 ? (clicked / sent) * 100 : 0,
    }))
    .sort((a, b) => b.sent - a.sent)
    .slice(0, 8);

  // Daily trend (last 7 days)
  const dailyTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter((l) => l.sent_at.startsWith(dateStr));
    const clicked = dayLogs.filter((l) => l.clicked).length;
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      sent: dayLogs.length,
      clicked,
    };
  });

  const StatCard = ({
    icon, label, value, sub, color,
  }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string }) => (
    <Card className="overflow-hidden border border-border/70">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color ?? ''}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="p-2 rounded-xl bg-primary/10 text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Notification Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Last refreshed: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading} className="gap-2">
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* ── KPI Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Send className="h-5 w-5" />}
              label="Total Sent"
              value={totalSent.toLocaleString()}
              sub="All-time push notifications"
            />
            <StatCard
              icon={<MousePointerClick className="h-5 w-5" />}
              label="Total Clicks"
              value={totalClicked.toLocaleString()}
              sub={`${formatPct(overallCTR)} overall CTR`}
              color="text-primary"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Best Variant"
              value={bestVariant ? `${bestVariant.variant}` : 'N/A'}
              sub={bestVariant ? `${formatPct(bestVariant.ctr)} CTR` : 'No data yet'}
              color="text-green-600 dark:text-green-400"
            />
            <StatCard
              icon={<Zap className="h-5 w-5" />}
              label="Re-Engagement"
              value={logs.filter((l) => l.trigger_type === 're-engagement').length}
              sub="Inactive user re-engages"
              color="text-amber-600 dark:text-amber-400"
            />
          </div>

          {/* ── Charts Row 1: Daily Trend + Trigger Breakdown ────────────── */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-2 border border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" /> 7-Day Notification Trend
                </CardTitle>
                <CardDescription>Sent vs clicked per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyTrend} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="sent" name="Sent" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="clicked" name="Clicked" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Trigger Types
                </CardTitle>
                <CardDescription>By notification trigger</CardDescription>
              </CardHeader>
              <CardContent>
                {triggerStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={triggerStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {triggerStats.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: '11px' }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No trigger data yet</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── A/B Variant Performance ──────────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="border border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  A/B Variant Performance
                </CardTitle>
                <CardDescription>Click-through rates per message style</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {variantStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No A/B data yet</p>
                ) : (
                  variantStats.map((v) => (
                    <div key={v.variant} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: VARIANT_COLORS[v.variant] || '#888' }}
                          />
                          <span className="font-medium capitalize">{v.variant}</span>
                          {bestVariant?.variant === v.variant && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/15 text-green-600">Best</Badge>
                          )}
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {v.clicked}/{v.sent} · <span className="font-semibold text-foreground">{formatPct(v.ctr)}</span>
                        </span>
                      </div>
                      <Progress
                        value={v.ctr}
                        max={100}
                        className="h-2 bg-muted/50"
                        style={{ '--progress-fill': VARIANT_COLORS[v.variant] } as React.CSSProperties}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* ── Top Categories ──────────────────────────────────────── */}
            <Card className="border border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top Task Categories</CardTitle>
                <CardDescription>Engagement by category</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No category data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryStats} layout="vertical" barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="category" type="category" width={90} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="sent" name="Sent" fill="hsl(var(--primary) / 0.4)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="clicked" name="Clicked" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Raw Log Table ─────────────────────────────────────────────── */}
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Recent Notification Log</CardTitle>
              <CardDescription>Last 20 push notifications sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-left py-2 pr-4 font-medium">Time</th>
                      <th className="text-left py-2 pr-4 font-medium">Trigger</th>
                      <th className="text-left py-2 pr-4 font-medium">Variant</th>
                      <th className="text-left py-2 font-medium">Clicked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 20).map((log) => (
                      <tr key={log.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-4 text-muted-foreground font-mono text-xs">
                          {new Date(log.sent_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge
                            variant="outline"
                            className="text-[10px] capitalize"
                            style={{ color: TRIGGER_COLORS[log.trigger_type] || undefined }}
                          >
                            {log.trigger_type}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge
                            variant="outline"
                            className="text-[10px] capitalize"
                            style={{ color: VARIANT_COLORS[log.variant] || undefined }}
                          >
                            {log.variant}
                          </Badge>
                        </td>
                        <td className="py-2.5">
                          {log.clicked ? (
                            <span className="text-green-600 dark:text-green-400 font-semibold text-xs">✓ Clicked</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

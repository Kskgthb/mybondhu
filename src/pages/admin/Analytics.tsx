import { useState, useEffect } from 'react';
import { profilesApi, tasksApi } from '@/db/api';
import { toast } from 'sonner';
import type { Profile, Task } from '@/types/types';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { RefreshCw, TrendingUp, Users, ClipboardList, Star } from 'lucide-react';

const COLORS = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899'];

export default function AdminAnalytics() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([
        profilesApi.getAllProfiles(0, 200),
        tasksApi.getAllTasks(0, 200),
      ]);
      setUsers(u); setTasks(t);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- chart data ---

  // Tasks per day (last 14 days)
  const last14 = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
  const tasksByDay = last14.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return {
      date: format(day, 'MMM dd'),
      tasks: tasks.filter(t => t.created_at?.startsWith(dayStr)).length,
    };
  });

  // User growth last 14 days
  const usersByDay = last14.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return {
      date: format(day, 'MMM dd'),
      users: users.filter(u => u.created_at?.startsWith(dayStr)).length,
    };
  });

  // Task status pie
  const statusPie = [
    { name: 'Pending',     value: tasks.filter(t => t.status === 'pending').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Completed',   value: tasks.filter(t => t.status === 'completed').length },
    { name: 'Cancelled',   value: tasks.filter(t => t.status === 'cancelled').length },
  ].filter(d => d.value > 0);

  // Top earning bondhus
  const topBondhus = users
    .filter(u => u.role === 'bondhu' && u.total_earnings > 0)
    .sort((a, b) => b.total_earnings - a.total_earnings)
    .slice(0, 8)
    .map(u => ({ name: u.username?.substring(0, 12) ?? 'Unknown', earnings: u.total_earnings }));

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  tasks.forEach(t => { if (t.category) categoryMap[t.category] = (categoryMap[t.category] ?? 0) + 1; });
  const categoryData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const tooltipStyle = {
    contentStyle: { background: '#1e293b', border: '1px solid #ffffff15', borderRadius: 12, color: '#f1f5f9', fontSize: 12 },
    cursor: { stroke: '#8b5cf6', strokeWidth: 1 },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-64 rounded-2xl bg-slate-800/60 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Platform trends and insights</p>
        </div>
        <button onClick={loadData}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users',   value: users.length,  icon: Users,         color: 'text-violet-400' },
          { label: 'Total Tasks',   value: tasks.length,  icon: ClipboardList, color: 'text-cyan-400' },
          { label: 'Bondhus',       value: users.filter(u => u.role === 'bondhu').length, icon: Star, color: 'text-amber-400' },
          { label: 'Completed',     value: tasks.filter(t => t.status === 'completed').length, icon: TrendingUp, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-slate-800/50 p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-slate-400 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tasks over time */}
      <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
        <h2 className="text-white font-semibold mb-1">Tasks Posted — Last 14 Days</h2>
        <p className="text-slate-400 text-xs mb-4">Daily task creation volume</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={tasksByDay}>
            <defs>
              <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="tasks" stroke="#8b5cf6" strokeWidth={2} fill="url(#tGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row: User Growth + Status Pie */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
          <h2 className="text-white font-semibold mb-1">User Registrations — Last 14 Days</h2>
          <p className="text-slate-400 text-xs mb-4">New users per day</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={usersByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
          <h2 className="text-white font-semibold mb-1">Task Status Distribution</h2>
          <p className="text-slate-400 text-xs mb-2">Current snapshot</p>
          {statusPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="45%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Row: Top Bondhus + Categories */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
          <h2 className="text-white font-semibold mb-1">Top Earning Bondhus</h2>
          <p className="text-slate-400 text-xs mb-4">Highest total earnings</p>
          {topBondhus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topBondhus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="earnings" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No earnings data yet</div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
          <h2 className="text-white font-semibold mb-1">Top Task Categories</h2>
          <p className="text-slate-400 text-xs mb-4">Most popular task types</p>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#06b6d4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No category data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

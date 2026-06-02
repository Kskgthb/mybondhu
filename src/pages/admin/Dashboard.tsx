import { useState, useEffect } from 'react';
import { profilesApi, tasksApi } from '@/db/api';
import { Users, ClipboardList, CheckCircle, Star, TrendingUp, RefreshCw, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile, Task } from '@/types/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subDays } from 'date-fns';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function StatCard({
  title, value, sub, icon: Icon, color
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur p-5">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 ${color}`} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <div className={`p-2 rounded-xl ${color} bg-opacity-20`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-slate-400 text-xs">{sub}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [usersData, tasksData] = await Promise.all([
        profilesApi.getAllProfiles(0, 100),
        tasksApi.getAllTasks(0, 100),
      ]);
      setUsers(usersData);
      setTasks(tasksData);
      if (showRefresh) toast.success('Dashboard refreshed');
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = {
    totalUsers: users.length,
    totalBondhus: users.filter(u => u.role === 'bondhu').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    cancelledTasks: tasks.filter(t => t.status === 'cancelled').length,
    totalRevenue: tasks.filter(t => t.status === 'completed').reduce((a, t) => a + (t.amount || 0), 0),
    completionRate: tasks.length > 0 ? ((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
    avgRating: (() => {
      const rated = users.filter(u => u.role === 'bondhu' && u.total_tasks > 0);
      return rated.length > 0 ? rated.reduce((a, u) => a + u.rating_avg, 0) / rated.length : 0;
    })(),
  };

  // Build last 7 days task chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const count = tasks.filter(t => t.created_at?.startsWith(dayStr)).length;
    return { date: format(day, 'MMM dd'), tasks: count };
  });

  const pieData = [
    { name: 'Pending',     value: tasks.filter(t => t.status === 'pending').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Completed',   value: tasks.filter(t => t.status === 'completed').length },
    { name: 'Cancelled',   value: tasks.filter(t => t.status === 'cancelled').length },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-slate-800/60 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back, here's what's happening</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"     value={stats.totalUsers}     sub={`${stats.totalBondhus} Bondhus`}        icon={Users}         color="bg-violet-500" />
        <StatCard title="Total Tasks"     value={stats.totalTasks}     sub={`${stats.pendingTasks} pending`}        icon={ClipboardList} color="bg-cyan-500" />
        <StatCard title="Completed"       value={stats.completedTasks} sub={`${stats.completionRate.toFixed(1)}% rate`} icon={CheckCircle}   color="bg-emerald-500" />
        <StatCard title="Avg Rating"      value={stats.avgRating.toFixed(1)} sub="out of 5 stars"            icon={Star}          color="bg-amber-500" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
          <h2 className="text-white font-semibold mb-1">Tasks This Week</h2>
          <p className="text-slate-400 text-xs mb-4">Tasks posted in the last 7 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #ffffff15', borderRadius: 12, color: '#f1f5f9' }}
                cursor={{ stroke: '#8b5cf6', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="tasks" stroke="#8b5cf6" strokeWidth={2} fill="url(#taskGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
          <h2 className="text-white font-semibold mb-1">Task Status</h2>
          <p className="text-slate-400 text-xs mb-4">Current distribution</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #ffffff15', borderRadius: 12, color: '#f1f5f9' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No task data</div>
          )}
        </div>
      </div>

      {/* Recent tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
          <h2 className="text-white font-semibold mb-4">Recent Users</h2>
          <div className="space-y-3">
            {users.slice(0, 6).map(user => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{user.username}</p>
                  <p className="text-slate-400 text-xs capitalize">{user.role.replace('_', ' ')} · {user.verification_status}</p>
                </div>
                {user.role === 'bondhu' && (
                  <div className="text-right">
                    <p className="text-amber-400 text-sm font-medium">⭐ {user.rating_avg.toFixed(1)}</p>
                    <p className="text-slate-400 text-xs">{user.total_tasks} tasks</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
          <h2 className="text-white font-semibold mb-4">Recent Tasks</h2>
          <div className="space-y-3">
            {tasks.slice(0, 6).map(task => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-white text-sm font-medium truncate">{task.title}</p>
                  <p className="text-slate-400 text-xs">{task.category} · ₹{task.amount}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  task.status === 'completed'  ? 'bg-emerald-500/20 text-emerald-400' :
                  task.status === 'pending'    ? 'bg-amber-500/20 text-amber-400' :
                  task.status === 'cancelled'  ? 'bg-red-500/20 text-red-400' :
                  'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

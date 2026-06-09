import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profilesApi, tasksApi, assignmentsApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { Profile, Task } from '@/types/types';
import {
  ArrowLeft, Star, CheckCircle, Clock, XCircle, Briefcase,
  Coins, CreditCard, TrendingUp, User, Wallet, AlertCircle,
  BarChart2, RefreshCw, ThumbsDown, Send, Ban
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

/* ─────────────────────────────────────────────────────────────────
   Helper: coloured stat card
───────────────────────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent: string; // tailwind bg colour token, e.g. 'bg-violet-500'
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur p-4 flex flex-col gap-1">
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20 ${accent}`} />
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 ${accent} bg-opacity-20`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-slate-400 text-xs font-medium">{label}</p>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      {sub && <p className="text-slate-500 text-[11px]">{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Helper: info row
───────────────────────────────────────────────────────────────── */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0 gap-4">
      <span className="text-slate-400 text-sm flex-shrink-0">{label}</span>
      <span className="text-white text-sm text-right font-medium break-all">{value ?? '—'}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────────── */
export default function AdminUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'financials'>('overview');

  const loadData = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setRefreshing(true);
    try {
      // Load profile
      const prof = await profilesApi.getProfile(userId);
      setProfile(prof);

      // Load tasks this user posted
      const { data: posted } = await supabase
        .from('tasks')
        .select('*')
        .eq('poster_id', userId)
        .order('created_at', { ascending: false });
      setPostedTasks(Array.isArray(posted) ? posted : []);

      // Load task assignments (if bondhu)
      const { data: assigned } = await supabase
        .from('task_assignments')
        .select('*, task:tasks(*)')
        .eq('bondhu_id', userId)
        .order('created_at', { ascending: false });
      setAssignedTasks(Array.isArray(assigned) ? assigned : []);

      // Load withdrawal requests
      const { data: wds } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setWithdrawals(Array.isArray(wds) ? wds : []);

      if (showRefresh) toast.success('Profile refreshed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── derived stats ── */
  const isBondhu  = profile?.role === 'bondhu';
  const isNeedBondhu = profile?.role === 'need_bondhu';

  // Need-Bondhu stats (task poster)
  const nbStats = {
    posted:    postedTasks.length,
    inProgress: postedTasks.filter(t => t.status === 'in_progress' || t.status === 'accepted').length,
    cancelled:  postedTasks.filter(t => t.status === 'cancelled').length,
    completed:  postedTasks.filter(t => t.status === 'completed').length,
    avgRating:  profile?.rating_avg ?? 0,
  };

  // Bondhu stats (service provider)
  const bStats = {
    completed:  assignedTasks.filter(a => a.task?.status === 'completed').length,
    inProgress: assignedTasks.filter(a => ['accepted','in_progress'].includes(a.task?.status)).length,
    declined:   assignedTasks.filter(a => a.status === 'declined').length,
    avgRating:  profile?.rating_avg ?? 0,
    totalEarning: profile?.total_earnings ?? 0,
    coins:      profile?.bondhu_coins ?? 0,
    upiId:      profile?.upi_id ?? null,
  };

  const totalWithdrawPending  = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + (w.amount ?? 0), 0);
  const totalWithdrawApproved = withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + (w.amount ?? 0), 0);

  /* ── role badge ── */
  const roleBadge = {
    need_bondhu: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    bondhu:      'bg-violet-500/20 text-violet-400 border-violet-500/30',
    admin:       'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }[profile?.role ?? 'need_bondhu'];

  const verifyBadge = {
    pending:  'bg-amber-500/20 text-amber-400',
    verified: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
  }[profile?.verification_status ?? 'pending'];

  const statusColor = (status: string) => ({
    pending:     'bg-amber-500/20 text-amber-400',
    accepted:    'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-cyan-500/20 text-cyan-400',
    completed:   'bg-emerald-500/20 text-emerald-400',
    cancelled:   'bg-red-500/20 text-red-400',
    declined:    'bg-red-500/20 text-red-400',
  }[status] ?? 'bg-slate-500/20 text-slate-400');

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-40 bg-slate-800 rounded-xl" />
        <div className="h-40 bg-slate-800/60 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-800/60 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
        <p className="text-white text-lg font-semibold">User not found</p>
        <button onClick={() => navigate('/admin/users')} className="mt-4 text-violet-400 text-sm hover:underline">
          ← Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Profile hero ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur p-6">
        {/* Decorative gradient */}
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <Avatar className="h-20 w-20 ring-4 ring-violet-500/30 flex-shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-2xl font-bold">
              {profile.username?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{profile.full_name || profile.username}</h1>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleBadge}`}>
                {profile.role === 'need_bondhu' ? 'Need Bondhu' : profile.role === 'bondhu' ? 'Bondhu' : 'Admin'}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${verifyBadge}`}>
                {profile.verification_status}
              </span>
            </div>
            <p className="text-slate-400 text-sm">@{profile.username}</p>
            <p className="text-slate-500 text-xs mt-0.5">{profile.email}</p>
          </div>

          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-amber-400 font-bold text-sm">{profile.rating_avg?.toFixed(1) ?? '—'}</span>
            <span className="text-slate-500 text-xs">/ 5</span>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: 'College', val: profile.college_name ?? profile.college ?? '—' },
            { label: 'Joined', val: profile.created_at ? format(new Date(profile.created_at), 'dd MMM yyyy') : '—' },
            { label: 'Phone', val: profile.phone ?? profile.contact_no ?? '—' },
            { label: 'BondhuCoins', val: `🪙 ${profile.bondhu_coins ?? 0}` },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/5 rounded-xl p-2.5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-white text-xs font-semibold truncate" title={val}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 w-fit border border-white/10">
        {(['overview', 'tasks', 'financials'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* ── Need Bondhu stats ── */}
          {(isNeedBondhu || isBondhu) && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-cyan-400" />
                <h2 className="text-white font-semibold">As Need-Bondhu (Task Poster)</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Briefcase}   label="Tasks Posted"   value={nbStats.posted}    accent="bg-cyan-500" />
                <StatCard icon={Clock}       label="In Progress"    value={nbStats.inProgress} accent="bg-blue-500" />
                <StatCard icon={XCircle}     label="Cancelled"      value={nbStats.cancelled}  accent="bg-red-500" />
                <StatCard icon={Star}        label="Avg Rating"     value={nbStats.avgRating.toFixed(1)} sub="out of 5" accent="bg-amber-500" />
              </div>
            </section>
          )}

          {/* ── Bondhu stats ── */}
          {isBondhu && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-violet-400" />
                <h2 className="text-white font-semibold">As Bondhu (Service Provider)</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard icon={CheckCircle} label="Completed"     value={bStats.completed}   accent="bg-emerald-500" />
                <StatCard icon={Clock}       label="In Progress"   value={bStats.inProgress}  accent="bg-blue-500" />
                <StatCard icon={ThumbsDown}  label="Declined"      value={bStats.declined}    accent="bg-red-500" />
                <StatCard icon={Star}        label="Avg Rating"    value={bStats.avgRating.toFixed(1)} sub="out of 5" accent="bg-amber-500" />
                <StatCard icon={TrendingUp}  label="Total Earned"  value={`₹${bStats.totalEarning.toLocaleString()}`} accent="bg-violet-500" />
                <StatCard icon={Coins}       label="BondhuCoins"   value={bStats.coins}       accent="bg-yellow-500" />
              </div>
            </section>
          )}

          {/* ── Personal info ── */}
          <section className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
            <h2 className="text-white font-semibold mb-3">Personal Information</h2>
            <div className="divide-y divide-white/5">
              <InfoRow label="Full Name"   value={profile.full_name ?? profile.username} />
              <InfoRow label="Email"       value={profile.email} />
              <InfoRow label="Phone"       value={profile.phone ?? profile.contact_no} />
              <InfoRow label="College"     value={profile.college_name ?? profile.college} />
              <InfoRow label="Campus"      value={profile.campus_location} />
              <InfoRow label="About"       value={profile.about} />
              {profile.expertise_categories && profile.expertise_categories.length > 0 && (
                <InfoRow label="Expertise"   value={
                  <div className="flex flex-wrap gap-1 justify-end">
                    {profile.expertise_categories.map(e => (
                      <span key={e} className="text-[10px] bg-violet-500/20 text-violet-300 rounded-full px-2 py-0.5">{e}</span>
                    ))}
                  </div>
                } />
              )}
              <InfoRow label="Referral Code" value={profile.referral_code} />
              <InfoRow label="Referred By"   value={profile.referred_by} />
            </div>
          </section>

          {/* ── Bondhu financial info ── */}
          {isBondhu && (
            <section className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h2 className="text-white font-semibold">Financial Details</h2>
              </div>
              <div className="divide-y divide-white/5">
                <InfoRow label="UPI ID"       value={
                  bStats.upiId
                    ? <span className="font-mono bg-slate-700 px-2 py-0.5 rounded-lg text-emerald-300">{bStats.upiId}</span>
                    : <span className="text-slate-500 italic">Not set</span>
                } />
                <InfoRow label="Total Earnings" value={`₹ ${bStats.totalEarning.toLocaleString()}`} />
                <InfoRow label="BondhuCoins"    value={`🪙 ${bStats.coins}`} />
                <InfoRow label="Pending Withdrawal"  value={`₹ ${totalWithdrawPending.toLocaleString()}`} />
                <InfoRow label="Approved Withdrawal" value={`₹ ${totalWithdrawApproved.toLocaleString()}`} />
              </div>
            </section>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: TASKS
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">

          {/* Tasks posted */}
          <section className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-semibold">Tasks Posted ({postedTasks.length})</h2>
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            {postedTasks.length === 0 ? (
              <p className="text-center py-10 text-slate-500 text-sm">No tasks posted</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                      <th className="px-5 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Category</th>
                      <th className="px-4 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {postedTasks.map(task => (
                      <tr key={task.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 text-white font-medium max-w-[180px] truncate">{task.title}</td>
                        <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{task.category}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">₹{task.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                          {format(new Date(task.created_at), 'dd MMM yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Tasks assigned (bondhu) */}
          {isBondhu && (
            <section className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-white font-semibold">Tasks Assigned ({assignedTasks.length})</h2>
                <Briefcase className="w-4 h-4 text-violet-400" />
              </div>
              {assignedTasks.length === 0 ? (
                <p className="text-center py-10 text-slate-500 text-sm">No assignments yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                        <th className="px-5 py-3 text-left">Title</th>
                        <th className="px-4 py-3 text-left hidden sm:table-cell">Category</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Assignment</th>
                        <th className="px-4 py-3 text-left">Task Status</th>
                        <th className="px-4 py-3 text-left hidden md:table-cell">Accepted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {assignedTasks.map(a => {
                        const task = a.task ?? {};
                        return (
                          <tr key={a.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-3 text-white font-medium max-w-[160px] truncate">{task.title ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{task.category ?? '—'}</td>
                            <td className="px-4 py-3 text-emerald-400 font-semibold">₹{task.amount ?? 0}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(a.status)}`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(task.status ?? '')}`}>
                                {(task.status ?? '').replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                              {a.accepted_at ? format(new Date(a.accepted_at), 'dd MMM yyyy') : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: FINANCIALS
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'financials' && (
        <div className="space-y-6">

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCard icon={TrendingUp} label="Total Earnings" value={`₹${(profile.total_earnings ?? 0).toLocaleString()}`} accent="bg-emerald-500" />
            <StatCard icon={Coins}      label="BondhuCoins"   value={profile.bondhu_coins ?? 0}  accent="bg-yellow-500" />
            <StatCard icon={Send}       label="Pending Withdrawal" value={`₹${totalWithdrawPending.toLocaleString()}`} accent="bg-blue-500" />
            <StatCard icon={CheckCircle} label="Paid Out"     value={`₹${totalWithdrawApproved.toLocaleString()}`} accent="bg-violet-500" />
          </div>

          {/* UPI block */}
          {isBondhu && (
            <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h2 className="text-white font-semibold">Bondhu UPI ID</h2>
              </div>
              {profile.upi_id ? (
                <div className="flex items-center gap-3 bg-slate-700/60 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="font-mono text-emerald-300 text-sm">{profile.upi_id}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-700/40 border border-dashed border-slate-600 rounded-xl px-4 py-3 text-slate-500 text-sm">
                  <Ban className="w-4 h-4" /> No UPI ID registered
                </div>
              )}
            </div>
          )}

          {/* Withdrawal requests table */}
          <section className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-semibold">Withdrawal Requests ({withdrawals.length})</h2>
              <Wallet className="w-4 h-4 text-violet-400" />
            </div>
            {withdrawals.length === 0 ? (
              <p className="text-center py-10 text-slate-500 text-sm">No withdrawal requests</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                      <th className="px-5 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">UPI ID</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Requested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {withdrawals.map(w => (
                      <tr key={w.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 text-emerald-400 font-bold">₹{(w.amount ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-300 font-mono text-xs">{w.upi_id ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                            w.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                            w.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {w.status ?? 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                          {w.created_at ? format(new Date(w.created_at), 'dd MMM yyyy, hh:mm a') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profilesApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { Profile } from '@/types/types';
import {
  ArrowLeft, Star, CheckCircle, Clock, XCircle,
  Coins, CreditCard, TrendingUp, User, Wallet, AlertCircle,
  RefreshCw, ThumbsDown, Send, Ban, Briefcase, IndianRupee,
  ExternalLink, Info
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

/* ─────────────────────────────────────────────────────────────────
   Stat card
───────────────────────────────────────────────────────────────── */
function StatCard({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ElementType; label: string;
  value: string | number; sub?: string; accent: string;
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
   Info row
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
   Status badge colour
───────────────────────────────────────────────────────────────── */
const statusColor = (status: string) =>
  ({
    pending:     'bg-amber-500/20 text-amber-400',
    accepted:    'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-cyan-500/20 text-cyan-400',
    completed:   'bg-emerald-500/20 text-emerald-400',
    cancelled:   'bg-red-500/20 text-red-400',
    declined:    'bg-red-500/20 text-red-400',
    approved:    'bg-emerald-500/20 text-emerald-400',
    rejected:    'bg-red-500/20 text-red-400',
  }[status] ?? 'bg-slate-500/20 text-slate-400');

/* ═══════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════ */
export default function AdminUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile]         = useState<Profile | null>(null);
  const [postedTasks, setPostedTasks] = useState<any[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [wdTableExists, setWdTableExists] = useState(true);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeTab, setActiveTab]     = useState<'overview' | 'tasks' | 'financials'>('overview');

  const loadData = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      /* ── 1. Profile ── */
      const prof = await profilesApi.getProfile(userId);
      setProfile(prof);

      /* ── 2. Tasks posted by this user ── */
      const { data: posted, error: postedErr } = await supabase
        .from('tasks')
        .select('id, title, category, amount, status, created_at, payment_method, urgency')
        .eq('poster_id', userId)
        .order('created_at', { ascending: false });
      if (postedErr) console.warn('Tasks query error:', postedErr.message);
      setPostedTasks(Array.isArray(posted) ? posted : []);

      /* ── 3. Task assignments (bondhu side) ── */
      const { data: assigned, error: assignErr } = await supabase
        .from('task_assignments')
        .select(`
          id, status, accepted_at, completed_at, created_at,
          task:tasks(id, title, category, amount, status)
        `)
        .eq('bondhu_id', userId)
        .order('created_at', { ascending: false });
      if (assignErr) console.warn('Assignments query error:', assignErr.message);
      setAssignedTasks(Array.isArray(assigned) ? assigned : []);

      /* ── 4. Withdrawal requests ── */
      const { data: wds, error: wdErr } = await supabase
        .from('withdrawal_requests')
        .select('id, amount, upi_id, status, note, created_at, processed_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (wdErr) {
        // Table may not exist yet — show a notice instead of crashing
        if (wdErr.code === '42P01' || wdErr.message?.includes('does not exist') || wdErr.message?.includes('relation')) {
          setWdTableExists(false);
          setWithdrawals([]);
        } else {
          console.warn('Withdrawal query error:', wdErr.message);
          setWithdrawals([]);
        }
      } else {
        setWdTableExists(true);
        setWithdrawals(Array.isArray(wds) ? wds : []);
      }

      if (showRefresh) toast.success('Profile refreshed');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) {
        toast.error('Not authenticated');
        return;
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: newStatus,
          processed_by: adminUser.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Withdrawal request marked as ${newStatus}`);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to update withdrawal: ${err.message}`);
    }
  };

  /* ─── derived ─── */
  const isBondhu    = profile?.role === 'bondhu';
  const isNBondhu   = profile?.role === 'need_bondhu';

  // Need-Bondhu stats
  const nb = {
    posted:    postedTasks.length,
    inProgress: postedTasks.filter(t => ['accepted', 'in_progress'].includes(t.status)).length,
    cancelled:  postedTasks.filter(t => t.status === 'cancelled').length,
    completed:  postedTasks.filter(t => t.status === 'completed').length,
    avgRating:  profile?.rating_avg ?? 0,
  };

  // Bondhu stats — use profile fields (populated by DB triggers)
  const bn = {
    completed:   assignedTasks.filter(a => a.task?.status === 'completed').length,
    inProgress:  assignedTasks.filter(a => ['accepted', 'in_progress'].includes(a.task?.status ?? '')).length,
    declined:    assignedTasks.filter(a => a.status === 'declined').length,
    avgRating:   profile?.rating_avg   ?? 0,
    // Use profile.total_earnings (set by DB trigger on task completion)
    totalEarnings: profile?.total_earnings ?? 0,
    coins:         profile?.bondhu_coins   ?? 0,
    // UPI directly from profile
    upiId:         profile?.upi_id         ?? null,
  };

  // Withdrawal aggregates
  const wdPending  = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + Number(w.amount ?? 0), 0);
  const wdApproved = withdrawals.filter(w => ['approved', 'completed'].includes(w.status)).reduce((s, w) => s + Number(w.amount ?? 0), 0);
  const wdApprovedNet = wdApproved * 0.85;
  const wdPendingNet = wdPending * 0.85;
  // Amount still available = total earnings minus approved/pending withdrawals
  const wdAvailable = Math.max(0, bn.totalEarnings - wdApproved - wdPending);

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

  /* ─── loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-40 bg-slate-800 rounded-xl" />
        <div className="h-48 bg-slate-800/60 rounded-2xl" />
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

      {/* ── Profile hero card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur p-6">
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
            <span className="text-amber-400 font-bold text-sm">{(profile.rating_avg ?? 0).toFixed(1)}</span>
            <span className="text-slate-500 text-xs">/ 5</span>
          </div>
        </div>

        {/* Quick info pills */}
        <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: 'College',     val: profile.college_name ?? profile.college ?? '—' },
            { label: 'Joined',      val: profile.created_at ? format(new Date(profile.created_at), 'dd MMM yyyy') : '—' },
            { label: 'Phone',       val: profile.phone ?? profile.contact_no ?? '—' },
            { label: 'BondhuCoins', val: `🪙 ${profile.bondhu_coins ?? 0}` },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/5 rounded-xl p-2.5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-white text-xs font-semibold truncate" title={val}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── UPI ID highlight bar (always visible) ── */}
      <div className={`rounded-2xl border ${bn.upiId ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-dashed border-slate-600 bg-slate-800/30'} px-5 py-3 flex items-center gap-3`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bn.upiId ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
          <CreditCard className={`w-4 h-4 ${bn.upiId ? 'text-emerald-400' : 'text-slate-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Bondhu UPI ID</p>
          {bn.upiId ? (
            <p className="text-emerald-300 font-mono text-sm font-semibold truncate">{bn.upiId}</p>
          ) : (
            <p className="text-slate-500 text-sm italic">Not registered yet</p>
          )}
        </div>
        {bn.upiId && (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
            ✓ SET
          </span>
        )}
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

      {/* ═══════════════════════════════════════════════════════
          OVERVIEW TAB
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* Need-Bondhu section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-cyan-400" />
              <h2 className="text-white font-semibold text-sm uppercase tracking-wider">As Need-Bondhu (Task Poster)</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Briefcase}  label="Tasks Posted"  value={nb.posted}     accent="bg-cyan-500" />
              <StatCard icon={Clock}      label="In Progress"   value={nb.inProgress}  accent="bg-blue-500" />
              <StatCard icon={XCircle}    label="Cancelled"     value={nb.cancelled}   accent="bg-red-500" />
              <StatCard icon={Star}       label="Avg Rating"    value={nb.avgRating.toFixed(1)} sub="out of 5" accent="bg-amber-500" />
            </div>
          </section>

          {/* Bondhu section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-violet-400" />
              <h2 className="text-white font-semibold text-sm uppercase tracking-wider">As Bondhu (Service Provider)</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={CheckCircle} label="Completed"     value={bn.completed}   accent="bg-emerald-500" />
              <StatCard icon={Clock}       label="In Progress"   value={bn.inProgress}  accent="bg-blue-500" />
              <StatCard icon={ThumbsDown}  label="Declined"      value={bn.declined}    accent="bg-red-500" />
              <StatCard icon={Star}        label="Avg Rating"    value={bn.avgRating.toFixed(1)} sub="out of 5" accent="bg-amber-500" />
              <StatCard icon={IndianRupee} label="Total Earned"  value={`₹${bn.totalEarnings.toLocaleString('en-IN')}`} accent="bg-violet-500" />
              <StatCard icon={Coins}       label="BondhuCoins"   value={bn.coins}       accent="bg-yellow-500" />
            </div>
          </section>

          {/* Personal info */}
          <section className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
            <h2 className="text-white font-semibold mb-3">Personal Information</h2>
            <div className="divide-y divide-white/5">
              <InfoRow label="Full Name"    value={profile.full_name ?? profile.username} />
              <InfoRow label="Email"        value={profile.email} />
              <InfoRow label="Phone"        value={profile.phone ?? profile.contact_no} />
              <InfoRow label="College"      value={profile.college_name ?? profile.college} />
              <InfoRow label="Campus"       value={profile.campus_location} />
              <InfoRow label="About"        value={profile.about} />
              {profile.expertise_categories && profile.expertise_categories.length > 0 && (
                <InfoRow label="Expertise" value={
                  <div className="flex flex-wrap gap-1 justify-end">
                    {profile.expertise_categories.map(e => (
                      <span key={e} className="text-[10px] bg-violet-500/20 text-violet-300 rounded-full px-2 py-0.5">{e}</span>
                    ))}
                  </div>
                } />
              )}
              <InfoRow label="Referral Code" value={profile.referral_code} />
            </div>
          </section>

          {/* Financial summary */}
          <section className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <h2 className="text-white font-semibold">Financial Summary</h2>
            </div>
            <div className="divide-y divide-white/5">
              <InfoRow label="UPI ID" value={
                bn.upiId
                  ? <span className="font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-lg">{bn.upiId}</span>
                  : <span className="text-slate-500 italic text-xs">Not registered</span>
              } />
              <InfoRow label="Total Earnings"      value={<span className="text-emerald-400 font-bold">₹ {bn.totalEarnings.toLocaleString('en-IN')}</span>} />
              <InfoRow label="Withdrawal Pending"  value={<span className="text-amber-400 font-semibold">₹ {wdPending.toLocaleString('en-IN')} (Net Payout: ₹{wdPendingNet.toLocaleString('en-IN')})</span>} />
              <InfoRow label="Withdrawal Paid Out" value={<span className="text-violet-400 font-semibold">₹ {wdApprovedNet.toLocaleString('en-IN')} (Gross: ₹{wdApproved.toLocaleString('en-IN')})</span>} />
              <InfoRow label="Available Balance"   value={<span className="text-cyan-400 font-bold">₹ {wdAvailable.toLocaleString('en-IN')}</span>} />
              <InfoRow label="BondhuCoins"         value={`🪙 ${bn.coins}`} />
            </div>
          </section>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TASKS TAB
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">

          {/* Tasks posted */}
          <section className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold">Tasks Posted</h2>
                <p className="text-slate-500 text-xs mt-0.5">{nb.posted} total · {nb.completed} completed · {nb.cancelled} cancelled</p>
              </div>
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            {postedTasks.length === 0 ? (
              <p className="text-center py-10 text-slate-500 text-sm">No tasks posted yet</p>
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
                        <td className="px-5 py-3 text-white font-medium max-w-[160px] truncate" title={task.title}>{task.title}</td>
                        <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{task.category}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">₹{task.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(task.status)}`}>
                            {task.status.replace(/_/g, ' ')}
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

          {/* Assignments */}
          <section className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-white font-semibold">Task Assignments (as Bondhu)</h2>
                  <p className="text-slate-500 text-xs mt-0.5">{assignedTasks.length} total · {bn.completed} completed · {bn.declined} declined</p>
                </div>
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
                        const task = Array.isArray(a.task) ? a.task[0] : a.task;
                        return (
                          <tr key={a.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-3 text-white font-medium max-w-[160px] truncate" title={task?.title ?? ''}>{task?.title ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{task?.category ?? '—'}</td>
                            <td className="px-4 py-3 text-emerald-400 font-semibold">₹{task?.amount ?? 0}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(a.status ?? '')}`}>
                                {(a.status ?? '').replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(task?.status ?? '')}`}>
                                {(task?.status ?? '').replace(/_/g, ' ')}
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
          );
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          FINANCIALS TAB
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'financials' && (
        <div className="space-y-6">

          {/* ── Earnings + wallet summary ── */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={IndianRupee} label="Total Earnings"     value={`₹${bn.totalEarnings.toLocaleString('en-IN')}`} sub="from completed tasks" accent="bg-emerald-500" />
            <StatCard icon={Coins}       label="BondhuCoins"        value={bn.coins}                                         sub="reward points"        accent="bg-yellow-500" />
            <StatCard icon={Send}        label="Pending Withdrawal"  value={`₹${wdPending.toLocaleString('en-IN')}`}         sub={`Est. Payout: ₹${wdPendingNet.toLocaleString('en-IN')} (15% fee)`}   accent="bg-blue-500" />
            <StatCard icon={CheckCircle} label="Total Paid Out"     value={`₹${wdApprovedNet.toLocaleString('en-IN')}`}        sub={`Net paid after 15% platform fee`} accent="bg-violet-500" />
          </div>

          {/* Available balance highlight */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Available Balance</p>
              <p className="text-cyan-300 text-2xl font-bold">₹ {wdAvailable.toLocaleString('en-IN')}</p>
              <p className="text-slate-500 text-xs">Total Earnings − Pending − Paid Out</p>
            </div>
          </div>

          {/* UPI ID card */}
          <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h2 className="text-white font-semibold">Bondhu UPI ID</h2>
            </div>
            {bn.upiId ? (
              <div className="flex items-center gap-3 bg-slate-700/60 border border-emerald-500/20 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Registered UPI</p>
                  <p className="font-mono text-emerald-300 text-sm font-semibold">{bn.upiId}</p>
                </div>
                <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
                  ACTIVE
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-700/40 border border-dashed border-slate-600 rounded-xl px-4 py-3">
                <Ban className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-slate-400 text-sm">No UPI ID registered</p>
                  <p className="text-slate-600 text-xs">User must add it from their profile → wallet section</p>
                </div>
              </div>
            )}
          </div>

          {/* Withdrawal requests table */}
          <section className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold">Withdrawal Requests</h2>
                <p className="text-slate-500 text-xs mt-0.5">{withdrawals.length} total · {withdrawals.filter(w => w.status === 'pending').length} pending</p>
              </div>
              <Wallet className="w-4 h-4 text-violet-400" />
            </div>

            {/* Table not created yet notice */}
            {!wdTableExists ? (
              <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Info className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-white font-medium">Withdrawal table not set up yet</p>
                <p className="text-slate-500 text-sm max-w-xs">
                  Run <code className="bg-slate-700 px-1 rounded text-amber-300">withdrawal_system_setup.sql</code> in your Supabase SQL Editor to enable withdrawal tracking.
                </p>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-violet-400 text-sm hover:underline"
                >
                  Open Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : withdrawals.length === 0 ? (
              <p className="text-center py-10 text-slate-500 text-sm">No withdrawal requests yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                      <th className="px-5 py-3 text-left">Requested (Gross)</th>
                      <th className="px-4 py-3 text-left">Fee (15%)</th>
                      <th className="px-4 py-3 text-left">Payout (Net)</th>
                      <th className="px-4 py-3 text-left">UPI ID</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Requested Date</th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">Processed Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {withdrawals.map(w => (
                      <tr key={w.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 text-slate-300 font-bold text-sm">
                          ₹{Number(w.amount ?? 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-amber-500/80 text-sm">
                          ₹{Number((w.amount ?? 0) * 0.15).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-bold text-base">
                          ₹{Number((w.amount ?? 0) * 0.85).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono text-xs">{w.upi_id ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${statusColor(w.status ?? 'pending')}`}>
                            {w.status ?? 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                          {w.created_at ? format(new Date(w.created_at), 'dd MMM yyyy, hh:mm a') : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                          {w.processed_at ? format(new Date(w.processed_at), 'dd MMM yyyy, hh:mm a') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {w.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateStatus(w.id, 'approved')}
                                className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(w.id, 'rejected')}
                                className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-2 py-1 rounded transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary footer */}
                <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between bg-slate-900/40 text-xs text-slate-400">
                  <span>Pending (Gross): <strong className="text-amber-400">₹{wdPending.toLocaleString('en-IN')}</strong> <span className="opacity-60">(Net Payout: ₹{wdPendingNet.toLocaleString('en-IN')})</span></span>
                  <span>Paid Out (Net): <strong className="text-violet-400">₹{wdApprovedNet.toLocaleString('en-IN')}</strong> <span className="opacity-60">(Gross: ₹{wdApproved.toLocaleString('en-IN')})</span></span>
                  <span>Available Balance: <strong className="text-cyan-400">₹{wdAvailable.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

    </div>
  );
}

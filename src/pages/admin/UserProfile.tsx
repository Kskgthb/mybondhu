import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profilesApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { LiveSyncBadge } from '@/components/admin/LiveSyncBadge';
import { isAdminEmail } from '@/config/adminConfig';
import { toast } from 'sonner';
import type { Profile } from '@/types/types';
import {
  ArrowLeft, Star, CheckCircle, Clock, XCircle,
  Coins, CreditCard, TrendingUp, User, Wallet, AlertCircle,
  RefreshCw, ThumbsDown, Send, Ban, Briefcase, IndianRupee,
  ExternalLink, Info, Copy, Check, CheckCheck, CheckCircle2,
  AlertTriangle, QrCode
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

  // Payment & verification modal states
  const [paymentModalItem, setPaymentModalItem] = useState<any | null>(null);
  const [rejectModalItem, setRejectModalItem]   = useState<any | null>(null);
  const [transactionRef, setTransactionRef]     = useState('');
  const [adminNote, setAdminNote]               = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [copiedId, setCopiedId]                 = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadData = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      /* ── 0. Ensure Admin session role in DB so RLS allows reading all records ── */
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.id && currentUser?.email && isAdminEmail(currentUser.email)) {
          await supabase.from('profiles').update({ role: 'admin' }).eq('id', currentUser.id);
        }
      } catch (authErr) {
        console.warn('Admin role verification notice:', authErr);
      }

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

      /* ── 4. Withdrawal requests (RPC or direct fallback) ── */
      try {
        const wds = await profilesApi.adminGetWithdrawals(userId);
        setWdTableExists(true);
        setWithdrawals(Array.isArray(wds) ? wds : []);
      } catch (wdErr: any) {
        if (wdErr.code === '42P01' || wdErr.message?.includes('does not exist') || wdErr.message?.includes('relation')) {
          setWdTableExists(false);
          setWithdrawals([]);
        } else {
          console.warn('Withdrawal query notice:', wdErr.message);
          setWithdrawals([]);
        }
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

  // Real-time synchronization for this user profile and related entities
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`admin-user-profile-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `poster_id=eq.${userId}` },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_assignments', filter: `bondhu_id=eq.${userId}` },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawal_requests', filter: `user_id=eq.${userId}` },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadData]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: 'approved' | 'completed' | 'rejected',
    noteText?: string
  ) => {
    setIsSubmittingAction(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) {
        toast.error('Not authenticated');
        return;
      }

      // Ensure admin role for this session
      if (adminUser.email && isAdminEmail(adminUser.email)) {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', adminUser.id);
      }

      await profilesApi.adminUpdateWithdrawalStatus(id, newStatus, noteText);

      toast.success(
        newStatus === 'approved' || newStatus === 'completed'
          ? '✓ Payment successfully confirmed & marked as Done!'
          : 'Withdrawal request rejected'
      );
      setPaymentModalItem(null);
      setRejectModalItem(null);
      setTransactionRef('');
      setAdminNote('');
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to update withdrawal: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
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
        <div className="flex items-center gap-2">
          <LiveSyncBadge />
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
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

          {/* ── ACTION REQUIRED: PENDING PAYOUT BANNER (Prominently shows how much to pay) ── */}
          {wdPending > 0 && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 p-6 shadow-xl shadow-emerald-950/50">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      Action Required • Pending Withdrawal Payout
                    </span>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-3 mt-1">
                    <span className="text-slate-300 text-sm font-semibold">How Much to Pay (Net Payout):</span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">
                      ₹{wdPendingNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-slate-400 text-xs mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Gross Requested: <strong className="text-white">₹{wdPending.toLocaleString('en-IN')}</strong></span>
                    <span>•</span>
                    <span>Platform Fee (15%): <strong className="text-amber-400">₹{(wdPending * 0.15).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                    <span>•</span>
                    <span>Net Transfer: <strong className="text-emerald-400 font-bold">₹{wdPendingNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  {/* UPI ID card with Copy */}
                  {(bn.upiId || withdrawals.find(w => w.status === 'pending')?.upi_id) && (
                    <div className="flex items-center justify-between gap-2 bg-slate-800/90 border border-emerald-500/30 rounded-xl px-3.5 py-2.5">
                      <CreditCard className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 leading-none">Pay to UPI</p>
                        <p className="font-mono text-xs font-bold text-emerald-300 truncate">
                          {withdrawals.find(w => w.status === 'pending')?.upi_id || bn.upiId}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(withdrawals.find(w => w.status === 'pending')?.upi_id || bn.upiId!, 'UPI ID')}
                        title="Copy UPI ID"
                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors ml-1"
                      >
                        {copiedId === (withdrawals.find(w => w.status === 'pending')?.upi_id || bn.upiId) ? (
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Payment Done Button */}
                  {withdrawals.find(w => w.status === 'pending') && (
                    <button
                      type="button"
                      onClick={() => setPaymentModalItem(withdrawals.find(w => w.status === 'pending'))}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Payment Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Earnings + wallet summary ── */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={IndianRupee} label="Total Earnings"     value={`₹${bn.totalEarnings.toLocaleString('en-IN')}`} sub="from completed tasks" accent="bg-emerald-500" />
            <StatCard icon={Coins}       label="BondhuCoins"        value={bn.coins}                                         sub="reward points"        accent="bg-yellow-500" />
            <StatCard icon={Send}        label="Pending Withdrawal"  value={`₹${wdPending.toLocaleString('en-IN')}`}         sub={`Est. Net: ₹${wdPendingNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (15% fee)`}   accent="bg-blue-500" />
            <StatCard icon={CheckCircle} label="Total Paid Out"     value={`₹${wdApprovedNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}        sub={`Net paid after 15% fee`} accent="bg-violet-500" />
          </div>

          {/* Available balance highlight */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Available Balance</p>
              <p className="text-cyan-300 text-2xl font-bold">₹ {wdAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-slate-500 text-xs">Total Earnings − Pending − Paid Out</p>
            </div>
          </div>

          {/* UPI ID card */}
          <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h2 className="text-white font-semibold">Bondhu UPI ID</h2>
              </div>
              {bn.upiId && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(bn.upiId!, 'UPI ID')}
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy UPI ID
                </button>
              )}
            </div>
            {bn.upiId ? (
              <div className="flex items-center justify-between gap-3 bg-slate-700/60 border border-emerald-500/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">Registered UPI</p>
                    <p className="font-mono text-emerald-300 text-sm font-semibold">{bn.upiId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
                    ACTIVE
                  </span>
                </div>
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
                  Run <code className="bg-slate-700 px-1 rounded text-amber-300">fix_withdrawal_admin_rls.sql</code> in your Supabase SQL Editor to enable withdrawal tracking and admin permissions.
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
              <div className="text-center py-12 px-4">
                <Wallet className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-white font-medium text-sm">No withdrawal requests found for this user</p>
                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                  When this Bondhu requests a withdrawal from their wallet, it will appear here for payout verification.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-white/5 bg-slate-900/30">
                      <th className="px-5 py-3 text-left">Requested (Gross)</th>
                      <th className="px-4 py-3 text-left">Fee (15%)</th>
                      <th className="px-4 py-3 text-left">How Much to Pay (Net)</th>
                      <th className="px-4 py-3 text-left">UPI ID</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Requested Date</th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">Notes / Ref</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {withdrawals.map(w => {
                      const gross = Number(w.amount ?? 0);
                      const fee = gross * 0.15;
                      const net = gross * 0.85;
                      const isPending = w.status === 'pending';

                      return (
                        <tr key={w.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3 text-slate-300 font-bold text-sm">
                            ₹{gross.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-amber-400/80 text-xs">
                            ₹{fee.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 font-bold text-sm px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              ₹{net.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-300 text-xs">{w.upi_id ?? '—'}</span>
                              {w.upi_id && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(w.upi_id, 'UPI ID')}
                                  title="Copy UPI"
                                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                  {copiedId === w.upi_id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${statusColor(w.status ?? 'pending')}`}>
                              {w.status === 'approved' || w.status === 'completed' ? '✓ Paid Out' : (w.status ?? 'pending')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                            {w.created_at ? format(new Date(w.created_at), 'dd MMM yyyy, hh:mm a') : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell max-w-[160px] truncate" title={w.note || ''}>
                            {w.note || (w.processed_at ? `Paid on ${format(new Date(w.processed_at), 'dd MMM yyyy')}` : '—')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  disabled={isSubmittingAction}
                                  onClick={() => setPaymentModalItem(w)}
                                  className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow transition-colors disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Payment Done
                                </button>
                                <button
                                  type="button"
                                  disabled={isSubmittingAction}
                                  onClick={() => setRejectModalItem(w)}
                                  className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <div className="text-right">
                                {w.status === 'approved' || w.status === 'completed' ? (
                                  <span className="text-emerald-400 text-xs font-semibold flex items-center justify-end gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                                  </span>
                                ) : (
                                  <span className="text-red-400 text-xs font-semibold">Rejected</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Summary footer */}
                <div className="px-5 py-3 border-t border-white/5 flex flex-wrap items-center justify-between bg-slate-900/60 text-xs text-slate-400 gap-2">
                  <span>Pending Gross: <strong className="text-amber-400">₹{wdPending.toLocaleString('en-IN')}</strong> <span className="opacity-70">(How Much to Pay Net: <strong className="text-emerald-400">₹{wdPendingNet.toFixed(2)}</strong>)</span></span>
                  <span>Paid Out (Net): <strong className="text-violet-400">₹{wdApprovedNet.toFixed(2)}</strong> <span className="opacity-70">(Gross: ₹{wdApproved.toLocaleString('en-IN')})</span></span>
                  <span>Available Balance: <strong className="text-cyan-400">₹{wdAvailable.toFixed(2)}</strong></span>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: PAYMENT DONE CONFIRMATION
      ═══════════════════════════════════════════════════════ */}
      {paymentModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !isSubmittingAction && setPaymentModalItem(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white text-lg font-bold">Confirm Payment Done</h3>
                <p className="text-slate-400 text-xs">Verify transfer to Bondhu account</p>
              </div>
            </div>

            {/* Payout calculation card */}
            <div className="bg-slate-800/80 border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-baseline justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Net Payout to Transfer:</span>
                <span className="text-2xl font-extrabold text-emerald-400">
                  ₹{(Number(paymentModalItem.amount ?? 0) * 0.85).toFixed(2)}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Requested:</span>
                  <span className="text-white font-medium">₹{Number(paymentModalItem.amount ?? 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Platform Fee (15%):</span>
                  <span className="text-amber-400 font-medium">- ₹{(Number(paymentModalItem.amount ?? 0) * 0.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-white/5">
                  <span>Transfer to UPI ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-emerald-300 font-bold">{paymentModalItem.upi_id || bn.upiId}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentModalItem.upi_id || bn.upiId, 'UPI ID')}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                      title="Copy UPI"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional UTR / Reference */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Transaction / UTR Reference (Optional):</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI/409823412 or GPay ID"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Admin Note (Optional):</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="e.g. Paid via Google Pay to Bondhu"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => setPaymentModalItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => {
                  const combinedNote = [transactionRef ? `UTR: ${transactionRef}` : '', adminNote].filter(Boolean).join(' • ');
                  handleUpdateStatus(paymentModalItem.id, 'approved', combinedNote);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Check className={`w-4 h-4 ${isSubmittingAction ? 'animate-spin' : ''}`} />
                {isSubmittingAction ? 'Saving...' : `Confirm Payment Done (₹${(Number(paymentModalItem.amount ?? 0) * 0.85).toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: REJECT CONFIRMATION
      ═══════════════════════════════════════════════════════ */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !isSubmittingAction && setRejectModalItem(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-11 h-11 rounded-full bg-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-white font-bold text-base">Reject Withdrawal Request?</h3>
              <p className="text-slate-400 text-xs mt-1">
                Amount requested: <strong className="text-white">₹{Number(rejectModalItem.amount ?? 0).toLocaleString('en-IN')}</strong>
              </p>
            </div>

            <div className="text-xs">
              <label className="text-slate-400 block mb-1 font-medium">Rejection Reason:</label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="e.g. Invalid UPI ID, please update in profile and request again."
                rows={3}
                className="w-full bg-slate-800 border border-white/10 rounded-xl p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => setRejectModalItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => handleUpdateStatus(rejectModalItem.id, 'rejected', adminNote)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-900/40 disabled:opacity-50"
              >
                {isSubmittingAction ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

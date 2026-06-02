import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { profilesApi } from '@/db/api';
import { toast } from 'sonner';
import type { Profile } from '@/types/types';
import { CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

type FilterStatus = 'pending' | 'verified' | 'rejected' | 'all';

const statusColor: Record<string, string> = {
  pending:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  verified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'verified') return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-amber-400" />;
};

export default function AdminVerifications() {
  const [bondhus, setBondhus] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);

  useEffect(() => { loadBondhus(); }, []);

  const loadBondhus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'bondhu')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBondhus(data ?? []);
    } catch {
      toast.error('Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (userId: string, status: 'verified' | 'rejected') => {
    setUpdating(userId);
    try {
      await profilesApi.updateProfile(userId, { verification_status: status } as any);
      setBondhus(prev => prev.map(b => b.id === userId ? { ...b, verification_status: status } : b));
      if (selected?.id === userId) setSelected(prev => prev ? { ...prev, verification_status: status } : prev);
      toast.success(`Bondhu ${status === 'verified' ? 'approved' : 'rejected'}`);
    } catch {
      toast.error('Failed to update verification status');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'all' ? bondhus : bondhus.filter(b => b.verification_status === filter);

  const counts = {
    all:      bondhus.length,
    pending:  bondhus.filter(b => b.verification_status === 'pending').length,
    verified: bondhus.filter(b => b.verification_status === 'verified').length,
    rejected: bondhus.filter(b => b.verification_status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Verifications</h1>
          <p className="text-slate-400 text-sm mt-1">Review Bondhu identity documents</p>
        </div>
        <button onClick={loadBondhus}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'verified', 'rejected', 'all'] as FilterStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filter === s
                ? 'bg-violet-600 text-white border-violet-500'
                : 'bg-slate-800 text-slate-400 border-white/10 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span className="capitalize">{s}</span>
            <span className="ml-2 text-xs opacity-70">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-slate-800/60 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm rounded-2xl border border-white/10 bg-slate-800/30">
          No {filter === 'all' ? '' : filter} verifications found
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(bondhu => (
            <div key={bondhu.id} className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={bondhu.photo_url ?? bondhu.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-violet-600 text-white text-sm">
                      {bondhu.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold text-sm">{bondhu.full_name ?? bondhu.username}</p>
                    <p className="text-slate-400 text-xs">{bondhu.college ?? bondhu.college_name ?? '—'}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor[bondhu.verification_status]}`}>
                  <StatusIcon status={bondhu.verification_status} />
                  <span className="capitalize">{bondhu.verification_status}</span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Campus</span>
                  <span className="text-slate-300 truncate ml-2 max-w-[150px]">{bondhu.campus_location ?? '—'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Phone</span>
                  <span className="text-slate-300">{bondhu.contact_no ?? bondhu.phone ?? '—'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Joined</span>
                  <span className="text-slate-300">
                    {bondhu.created_at ? format(new Date(bondhu.created_at), 'dd MMM yyyy') : '—'}
                  </span>
                </div>
              </div>

              {/* Document links */}
              <div className="flex flex-wrap gap-2">
                {bondhu.photo_url && (
                  <a href={bondhu.photo_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-lg transition-colors">
                    <ExternalLink className="w-3 h-3" /> Photo
                  </a>
                )}
                {bondhu.college_id_url && (
                  <a href={bondhu.college_id_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg transition-colors">
                    <ExternalLink className="w-3 h-3" /> College ID
                  </a>
                )}
                {bondhu.aadhaar_url && (
                  <a href={bondhu.aadhaar_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg transition-colors">
                    <ExternalLink className="w-3 h-3" /> Aadhaar
                  </a>
                )}
                {!bondhu.photo_url && !bondhu.college_id_url && !bondhu.aadhaar_url && (
                  <span className="text-xs text-slate-500">No documents uploaded</span>
                )}
              </div>

              {/* Action Buttons */}
              {bondhu.verification_status === 'pending' && (
                <div className="flex gap-2 mt-auto">
                  <button
                    disabled={updating === bondhu.id}
                    onClick={() => updateVerificationStatus(bondhu.id, 'verified')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {updating === bondhu.id ? 'Saving...' : 'Approve'}
                  </button>
                  <button
                    disabled={updating === bondhu.id}
                    onClick={() => updateVerificationStatus(bondhu.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}
              {bondhu.verification_status === 'verified' && (
                <button
                  disabled={updating === bondhu.id}
                  onClick={() => updateVerificationStatus(bondhu.id, 'rejected')}
                  className="mt-auto py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Revoke Verification
                </button>
              )}
              {bondhu.verification_status === 'rejected' && (
                <button
                  disabled={updating === bondhu.id}
                  onClick={() => updateVerificationStatus(bondhu.id, 'verified')}
                  className="mt-auto py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Approve Instead
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

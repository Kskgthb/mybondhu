import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profilesApi } from '@/db/api';
import { toast } from 'sonner';
import type { Profile, UserRole } from '@/types/types';
import { Search, ChevronLeft, ChevronRight, Shield, User, Briefcase, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

const ROLE_OPTIONS: UserRole[] = ['need_bondhu', 'bondhu', 'admin'];

const roleLabel: Record<string, string> = {
  need_bondhu: 'Need Bondhu',
  bondhu: 'Bondhu',
  admin: 'Admin',
};

const roleColor: Record<string, string> = {
  need_bondhu: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  bondhu: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  admin: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const verifyColor: Record<string, string> = {
  pending:  'bg-amber-500/20 text-amber-400',
  verified: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verifyFilter, setVerifyFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const PAGE_SIZE = 10;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await profilesApi.getAllProfiles(0, 200);
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingRole(userId);
    try {
      await profilesApi.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      if (selectedUser?.id === userId) setSelectedUser(prev => prev ? { ...prev, role: newRole } : prev);
      toast.success(`Role updated to ${roleLabel[newRole]}`);
    } catch {
      toast.error('Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchVerify = verifyFilter === 'all' || u.verification_status === verifyFilter;
    return matchSearch && matchRole && matchVerify;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-slate-400 text-sm mt-1">{users.length} total users registered</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search username or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(0); }}
          className="px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="all">All Roles</option>
          <option value="need_bondhu">Need Bondhu</option>
          <option value="bondhu">Bondhu</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={verifyFilter}
          onChange={e => { setVerifyFilter(e.target.value); setPage(0); }}
          className="px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-xl bg-slate-700/50 animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3">User</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Email</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Role</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Verification</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Joined</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginated.map(user => (
                    <tr
                      key={user.id}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={user.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-violet-600 text-white text-xs">
                              {user.username?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm font-medium">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-slate-400 text-sm">{user.email ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${roleColor[user.role]}`}>
                          {roleLabel[user.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${verifyColor[user.verification_status]}`}>
                          {user.verification_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-slate-400 text-xs">
                          {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                            disabled={updatingRole === user.id}
                            className="text-xs bg-slate-700 border border-white/10 text-white rounded-lg px-2 py-1 focus:outline-none focus:border-violet-500 disabled:opacity-50"
                          >
                            {ROLE_OPTIONS.map(r => (
                              <option key={r} value={r}>{roleLabel[r]}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            title="View full profile"
                            className="p-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/40 text-violet-400 transition-colors flex-shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {paginated.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm">No users found</div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-white">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-2 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-5">
              <Avatar className="h-14 w-14">
                <AvatarImage src={selectedUser.avatar_url ?? undefined} />
                <AvatarFallback className="bg-violet-600 text-white text-lg">
                  {selectedUser.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-white text-lg font-bold">{selectedUser.username}</h2>
                <p className="text-slate-400 text-sm">{selectedUser.email ?? 'No email'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Role',         roleLabel[selectedUser.role]],
                ['Verification', selectedUser.verification_status],
                ['College',      selectedUser.college ?? selectedUser.college_name ?? '—'],
                ['Phone',        selectedUser.phone ?? selectedUser.contact_no ?? '—'],
                ['Tasks Posted', selectedUser.total_tasks_posted?.toString() ?? '0'],
                ['Rating Avg',   selectedUser.rating_avg?.toFixed(1) ?? '—'],
                ['Coins',        selectedUser.bondhu_coins?.toString() ?? '0'],
                ['Joined',       selectedUser.created_at ? format(new Date(selectedUser.created_at), 'dd MMM yyyy') : '—'],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">{label}</p>
                  <p className="text-white font-medium truncate">{val}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => { setSelectedUser(null); navigate(`/admin/users/${selectedUser.id}`); }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
              >
                <ExternalLink className="w-4 h-4" /> View Full Profile
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

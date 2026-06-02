import { useState, useEffect } from 'react';
import { tasksApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { Task } from '@/types/types';
import { Search, ChevronLeft, ChevronRight, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['all','pending','accepted','in_progress','completed','cancelled'];
const URGENCY_OPTIONS = ['all','low','medium','high','urgent'];

const statusColor: Record<string, string> = {
  pending:     'bg-amber-500/20 text-amber-400',
  accepted:    'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-cyan-500/20 text-cyan-400',
  completed:   'bg-emerald-500/20 text-emerald-400',
  cancelled:   'bg-red-500/20 text-red-400',
};

const urgencyColor: Record<string, string> = {
  low:    'bg-slate-500/20 text-slate-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high:   'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400',
};

interface TaskWithPosterName extends Task {
  posterUsername?: string;
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState<TaskWithPosterName[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedTask, setSelectedTask] = useState<TaskWithPosterName | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await tasksApi.getAllTasks(0, 200);
      // Enrich with poster usernames
      const posterIds = [...new Set(data.map(t => t.poster_id).filter(Boolean))];
      let posterMap: Record<string, string> = {};
      if (posterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', posterIds);
        if (profiles) {
          profiles.forEach((p: any) => { posterMap[p.id] = p.username; });
        }
      }
      setTasks(data.map(t => ({ ...t, posterUsername: posterMap[t.poster_id] ?? '—' })));
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await tasksApi.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setDeleteConfirm(null);
      setSelectedTask(null);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const filtered = tasks.filter(t => {
    const matchSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase()) ||
      t.posterUsername?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchUrgency = urgencyFilter === 'all' || t.urgency === urgencyFilter;
    return matchSearch && matchStatus && matchUrgency;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Tasks</h1>
        <p className="text-slate-400 text-sm mt-1">{tasks.length} total tasks in the system</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by title, category, poster..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={urgencyFilter}
          onChange={e => { setUrgencyFilter(e.target.value); setPage(0); }}
          className="px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
        >
          {URGENCY_OPTIONS.map(u => (
            <option key={u} value={u}>{u === 'all' ? 'All Urgency' : u}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-xl bg-slate-700/50 animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3">Task</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Poster</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Urgency</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Date</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginated.map(task => (
                  <tr key={task.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-white text-sm font-medium truncate max-w-[180px]">{task.title}</p>
                        <p className="text-slate-400 text-xs">{task.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-slate-300 text-sm">{task.posterUsername}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-400 text-sm font-semibold">₹{task.amount}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgencyColor[task.urgency]}`}>
                        {task.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[task.status]}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-slate-400 text-xs">
                        {task.created_at ? format(new Date(task.created_at), 'dd MMM yyyy') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(task.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginated.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm">No tasks found</div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-2 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-white">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="p-2 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-white text-lg font-bold mb-1">{selectedTask.title}</h2>
            <p className="text-slate-400 text-sm mb-5">{selectedTask.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Category',    selectedTask.category],
                ['Amount',      `₹${selectedTask.amount}`],
                ['Status',      selectedTask.status.replace('_', ' ')],
                ['Urgency',     selectedTask.urgency],
                ['Payment',     selectedTask.payment_method],
                ['Poster',      selectedTask.posterUsername ?? '—'],
                ['Location',    selectedTask.location_address ?? '—'],
                ['Created',     selectedTask.created_at ? format(new Date(selectedTask.created_at), 'dd MMM yyyy') : '—'],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">{label}</p>
                  <p className="text-white font-medium truncate">{val}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setSelectedTask(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
                Close
              </button>
              <button onClick={() => { setDeleteConfirm(selectedTask.id); setSelectedTask(null); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Delete Task?</h3>
            <p className="text-slate-400 text-sm mb-6">This action cannot be undone. The task will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

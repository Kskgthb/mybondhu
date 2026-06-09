import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wallet, CheckCircle2, TrendingUp, IndianRupee, Edit2, Check,
  Clock, XCircle, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { profilesApi } from '@/db/api';

interface WalletSectionProps {
  userId: string;
  totalTasks: number;
  totalEarnings: number;
  upiId: string | null;
  onUpdate: () => void;
}

export default function WalletSection({ userId, totalTasks, totalEarnings, upiId, onUpdate }: WalletSectionProps) {
  const [isEditingUpi, setIsEditingUpi] = useState(!upiId);
  const [newUpiId, setNewUpiId] = useState(upiId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);

  // Sync state when upiId prop changes (e.g. after async profile load)
  useEffect(() => {
    setNewUpiId(upiId || '');
    setIsEditingUpi(!upiId);
  }, [upiId]);

  // Fetch withdrawal history
  const fetchWithdrawals = async () => {
    if (!userId) return;
    try {
      const data = await profilesApi.getWithdrawals(userId);
      setWithdrawals(data);
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [userId]);

  // Calculate aggregates
  const wdPending = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const wdApproved = withdrawals
    .filter(w => ['approved', 'completed'].includes(w.status))
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const wdAvailable = Math.max(0, totalEarnings - wdPending - wdApproved);

  const handleUpdateUpi = async () => {
    if (!newUpiId.trim()) {
      toast.error('Please enter a valid UPI ID');
      return;
    }

    if (!newUpiId.includes('@')) {
      toast.error('Invalid UPI ID format (must contain @)');
      return;
    }

    setIsSubmitting(true);
    try {
      await profilesApi.updateProfile(userId, { upi_id: newUpiId });
      toast.success('UPI ID updated successfully');
      setIsEditingUpi(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update UPI ID');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > wdAvailable) {
      toast.error(`Insufficient available balance (Available: ₹${wdAvailable.toLocaleString('en-IN')})`);
      return;
    }

    if (!upiId) {
      toast.error('Please set and save your UPI ID first');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await profilesApi.requestWithdrawal(amount, upiId);
      if (res.success) {
        toast.success(res.message);
        setWithdrawAmount('');
        await fetchWithdrawals();
        onUpdate();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Failed to process withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Pending', icon: Clock },
      approved: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Approved', icon: CheckCircle2 },
      completed: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Paid Out', icon: CheckCircle2 },
      rejected: { bg: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Rejected', icon: XCircle }
    };
    const config = configs[status as keyof typeof configs] || { bg: 'bg-slate-100 text-slate-800 border-slate-200', label: status, icon: Clock };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Financial Overview Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Earnings */}
        <Card className="bg-white border-primary/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{totalEarnings.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-gray-500 mt-1">Life-time task earnings</p>
          </CardContent>
        </Card>

        {/* Available Balance */}
        <Card className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-none shadow-md relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-primary-foreground/80 uppercase tracking-wider flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{wdAvailable.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-primary-foreground/70 mt-1">Eligible for instant withdrawal</p>
          </CardContent>
        </Card>

        {/* Pending Withdrawals */}
        <Card className="bg-white border-primary/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{wdPending.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-gray-500 mt-1">Awaiting admin processing</p>
          </CardContent>
        </Card>

        {/* Paid Out */}
        <Card className="bg-white border-primary/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
              Paid Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{wdApproved.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-gray-500 mt-1">Successfully sent to your UPI</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* UPI & Withdrawal Settings */}
        <Card className="md:col-span-2 border-primary/10 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Withdrawal Panel
            </CardTitle>
            <CardDescription className="text-xs">Setup UPI and request your money</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-gray-500 uppercase">UPI ID</Label>
                {upiId && !isEditingUpi && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-medium">
                    ✓ Registered
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="username@upi"
                  value={newUpiId}
                  onChange={(e) => setNewUpiId(e.target.value)}
                  disabled={!isEditingUpi || isSubmitting}
                  className="h-9 font-mono"
                />
                {isEditingUpi ? (
                  <Button size="sm" onClick={handleUpdateUpi} disabled={isSubmitting} className="h-9">
                    {isSubmitting ? <Check className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditingUpi(true)} className="h-9">
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Withdraw Funds</Label>
                <span className="text-[10px] text-gray-500">Max: ₹{wdAvailable.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={isSubmitting || !upiId}
                    className="pl-9 h-9"
                  />
                </div>
                <Button
                  size="sm"
                  className="bg-secondary hover:bg-secondary/90 h-9 font-semibold text-white px-4"
                  onClick={handleWithdraw}
                  disabled={isSubmitting || !upiId || wdAvailable <= 0 || !withdrawAmount}
                >
                  Request
                </Button>
              </div>
              {!upiId && (
                <p className="text-[10px] text-rose-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Please add and save a UPI ID to withdraw funds.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Request History */}
        <Card className="md:col-span-3 border-primary/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Withdrawal Requests History</span>
              <span className="text-xs font-normal text-gray-500">
                {withdrawals.length} request{withdrawals.length !== 1 && 's'}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Status of your requests. Paid out within 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingWithdrawals ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading history...</div>
            ) : withdrawals.length === 0 ? (
              <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                <HelpCircle className="h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium">No withdrawals requested yet</p>
                <p className="text-xs text-gray-400 max-w-[240px]">
                  When you request a withdrawal, it will appear here with its status.
                </p>
              </div>
            ) : (
              <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100 border-t border-gray-100">
                {withdrawals.map((w) => (
                  <div key={w.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                        <IndianRupee className="h-3.5 w-3.5 text-gray-600" />
                        <span>{Number(w.amount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        UPI: <span className="font-mono">{w.upi_id}</span> • {new Date(w.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div>{getStatusBadge(w.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

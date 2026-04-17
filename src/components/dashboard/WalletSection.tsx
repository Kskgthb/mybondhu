import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, CheckCircle2, TrendingUp, IndianRupee, Edit2, Check } from 'lucide-react';
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

    if (amount > totalEarnings) {
      toast.error('Insufficient balance');
      return;
    }

    if (!upiId) {
      toast.error('Please set your UPI ID first');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await profilesApi.requestWithdrawal(amount, upiId);
      if (res.success) {
        toast.success(res.message);
        setWithdrawAmount('');
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Failed to process withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Earnings Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Total Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">₹{totalEarnings.toLocaleString('en-IN')}</div>
          <p className="text-xs text-primary-foreground/60 mt-1">From completed tasks</p>
        </CardContent>
      </Card>

      {/* Tasks Completed Card */}
      <Card className="bg-white border-primary/10 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-secondary" />
            Tasks Completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{totalTasks}</div>
          <p className="text-xs text-muted-foreground mt-1">Reliable helper</p>
        </CardContent>
      </Card>

      {/* UPI & Withdrawal Section */}
      <Card className="md:col-span-2 lg:col-span-1 border-primary/10 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Bondhu Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase">UPI ID</Label>
            <div className="flex gap-2">
              <Input
                placeholder="example@upi"
                value={newUpiId}
                onChange={(e) => setNewUpiId(e.target.value)}
                disabled={!isEditingUpi || isSubmitting}
                className="h-9"
              />
              {isEditingUpi ? (
                <Button size="sm" onClick={handleUpdateUpi} disabled={isSubmitting}>
                  {isSubmitting ? <Check className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setIsEditingUpi(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <Label className="text-xs font-semibold text-gray-500 uppercase">Withdraw Funds</Label>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-grow">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button size="sm" className="bg-secondary hover:bg-secondary/90" onClick={handleWithdraw} disabled={isSubmitting || !upiId}>
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

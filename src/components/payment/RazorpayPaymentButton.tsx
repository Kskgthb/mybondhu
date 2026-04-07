/**
 * Razorpay Payment Button Component
 * Handles online payment via Razorpay for tasks
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { initiatePayment } from '@/services/paymentService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface RazorpayPaymentButtonProps {
  taskId: string;
  amount: number;
  taskTitle: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function RazorpayPaymentButton({
  taskId,
  amount,
  taskTitle,
  onSuccess,
  onError,
  disabled = false,
  className = '',
}: RazorpayPaymentButtonProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to make payment');
      return;
    }

    try {
      setLoading(true);

      const result = await initiatePayment(
        {
          amount,
          name: 'Bondhu App',
          description: taskTitle,
          prefill: {
            name: profile?.full_name || undefined,
            email: user.email || undefined,
            contact: profile?.phone || undefined,
          },
          notes: {
            task_id: taskId,
            user_id: user.id,
          },
          theme: {
            color: '#3A8B24',
          },
        },
        taskId
      );

      if (result.success) {
        toast.success('Payment successful!');
        onSuccess?.(result.paymentId!);
      } else {
        toast.error(result.error || 'Payment failed');
        onError?.(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Payment failed';
      toast.error(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={className}
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-5 w-5" />
          Pay ₹{amount} via Razorpay
        </>
      )}
    </Button>
  );
}

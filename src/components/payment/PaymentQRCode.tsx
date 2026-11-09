import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, IndianRupee, Smartphone, ExternalLink, CheckCircle, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';
import { toast } from 'sonner';

interface PaymentQRCodeProps {
  amount: number;
  qrData?: string;
  taskTitle?: string;
  taskId?: string;
  paymentStatus?: string;
  onPaymentDone?: () => void;
  isSubmitting?: boolean;
}

export default function PaymentQRCode({
  amount,
  taskTitle = 'Task Payment',
  onPaymentDone,
  isSubmitting = false,
}: PaymentQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const razorpayUrl = 'https://razorpay.me/@bondhuapp';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(razorpayUrl);
    setCopied(true);
    toast.success('Razorpay link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-500/5 via-slate-900/40 to-slate-900 border-2 border-emerald-500/30 shadow-xl overflow-hidden">
      <CardHeader className="text-center pb-3">
        <div className="flex justify-center mb-2">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
            <QrCode className="h-7 w-7" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Scan to Pay via Razorpay</CardTitle>
        <CardDescription className="text-slate-400 text-xs">
          Use any UPI app (GPay, PhonePe, Paytm) or pay online at razorpay.me/@bondhuapp
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dynamic QR Code for razorpay.me/@bondhuapp */}
        <div className="flex flex-col items-center justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-emerald-500/40 flex items-center justify-center">
            <QRCodeDataUrl
              text={razorpayUrl}
              width={220}
              className="rounded-lg shadow-sm"
            />
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold mt-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            razorpay.me/@bondhuapp
          </span>
        </div>

        {/* Payment Amount Box */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-emerald-500/20 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Task</span>
            <span className="font-semibold text-white truncate max-w-[200px]">{taskTitle}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-sm font-medium text-slate-300">Exact Amount to Pay:</span>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-5 w-5 text-emerald-400" />
              <span className="text-2xl font-black text-emerald-400">
                ₹{Number(amount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Pay Action Buttons */}
        <div className="space-y-2">
          <a
            href={razorpayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Open razorpay.me/@bondhuapp
          </a>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopyLink}
            className="w-full text-xs border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Link!' : 'Copy Payment Link (razorpay.me/@bondhuapp)'}
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/40 rounded-xl p-3 border border-white/5">
          <div className="flex items-start gap-2.5">
            <Smartphone className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">How to Pay:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Scan the QR code with GPay, PhonePe, Paytm, etc. OR tap <strong>Open razorpay.me/@bondhuapp</strong></li>
                <li>Enter the exact task amount <strong>₹{Number(amount || 0).toFixed(2)}</strong> and complete the payment</li>
                <li>Tap <strong>Payment Done</strong> below to reveal your 6-digit Task Completion Code</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Payment Confirmation Button */}
        {onPaymentDone && (
          <Button
            type="button"
            onClick={onPaymentDone}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-white" />
            {isSubmitting ? 'Confirming Payment...' : 'Payment Done (Reveal Completion Code)'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

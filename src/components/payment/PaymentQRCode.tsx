import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, IndianRupee, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentQRCodeProps {
  qrData: string;
  amount: number;
  taskTitle?: string;
  taskId?: string;
  paymentStatus?: string;
}

export default function PaymentQRCode({ qrData, amount, taskTitle = 'Task Payment' }: PaymentQRCodeProps) {
  // Show error if no QR data
  if (!qrData) {
    return (
      <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
        <CardHeader className="text-center">
          <CardTitle className="text-destructive">Payment QR Not Available</CardTitle>
          <CardDescription>
            Unable to generate payment QR code. Please contact support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 shadow-lg">
      <CardHeader className="text-center pb-3">
        <div className="flex justify-center mb-2">
          <div className="p-3 rounded-full bg-primary/20">
            <QrCode className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl">Scan to Pay</CardTitle>
        <CardDescription>Use any UPI app to complete payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Image */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-xl shadow-md border-2 border-primary/20">
            <img 
              src="/assets/razorpay-qr.png" 
              alt="Razorpay Payment QR Code" 
              className="w-full max-w-[280px] h-auto object-contain"
            />
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-primary/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Task</span>
            <span className="text-sm font-semibold text-foreground">{taskTitle}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground font-medium">Amount to Pay</span>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-4 w-4 text-primary" />
              <span className="text-xl font-bold text-primary">₹{amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
          <div className="flex items-start gap-2">
            <Smartphone className="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-accent-foreground">How to Pay:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                <li>Scan this QR code</li>
                <li>Verify the amount and complete payment</li>
                <li>Task will be marked complete after payment</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="gap-2 border-warning/30 bg-warning/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
            </span>
            Waiting for Payment
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

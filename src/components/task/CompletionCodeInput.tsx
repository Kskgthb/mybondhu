import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CompletionCodeInputProps {
  taskId: string;
  taskTitle: string;
  onComplete: (code: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CompletionCodeInput({
  taskTitle,
  onComplete,
  isLoading = false,
}: CompletionCodeInputProps) {
  const [code, setCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast.error('Please enter the full 6-digit completion code');
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(code);
    } catch (error: any) {
      toast.error(error.message || 'Invalid completion code. Please check and try again.');
      console.error('Error completing task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900 shadow-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-white">Task Code Verification</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter the 6-digit completion code provided by the task poster
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="completion-code" className="text-xs font-semibold text-slate-300">
              6-Digit Completion Code *
            </Label>
            <div className="relative">
              <Input
                id="completion-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="• • • • • •"
                value={code}
                onChange={handleCodeChange}
                maxLength={6}
                autoComplete="one-time-code"
                className="text-3xl font-mono tracking-widest text-center py-6 bg-slate-950/60 border-2 border-emerald-500/30 focus:border-emerald-500 text-emerald-400 font-bold placeholder:text-slate-600 rounded-xl"
                disabled={isLoading || isSubmitting}
              />
            </div>
            <p className="text-xs text-slate-400 flex items-center justify-between">
              <span>Ask poster: "Please share the 6-digit code shown on your screen"</span>
              <span className="font-mono text-emerald-400 font-bold">{code.length}/6</span>
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-white/5">
            <p className="text-[11px] text-slate-400">Task Being Completed:</p>
            <p className="text-sm font-semibold text-white truncate">{taskTitle}</p>
          </div>

          {/* Confirm Payment & Complete Task Button */}
          <Button
            type="submit"
            className="w-full py-4 text-base font-extrabold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            disabled={code.length !== 6 || isLoading || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying & Completing Task...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-white" />
                Confirm Payment & Complete Task
              </>
            )}
          </Button>

          <div className="pt-2 border-t border-white/5 space-y-1">
            <p className="text-[11px] text-slate-400">
              🔒 Entering this code verifies the task and immediately credits the earnings to your Bondhu wallet.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

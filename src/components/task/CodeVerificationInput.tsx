import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CodeVerificationInputProps {
  taskId: string;
  taskTitle: string;
  onVerify: (code: string) => Promise<boolean>;
  loading?: boolean;
}

export default function CodeVerificationInput({ 
  taskId, 
  taskTitle, 
  onVerify, 
  loading = false 
}: CodeVerificationInputProps) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleCodeChange = (value: string) => {
    // Only allow digits and max 6 characters
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    setCode(sanitized);
    setError('');
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const success = await onVerify(code);
      
      if (success) {
        toast.success('Task completed successfully!', {
          description: 'Payment will be processed and added to your wallet.',
        });
      } else {
        setError('Invalid code. Please check and try again.');
        toast.error('Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Failed to verify code. Please try again.');
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border-primary/20 shadow-lg">
      <CardHeader className="text-center pb-3">
        <div className="flex justify-center mb-2">
          <div className="p-3 rounded-full bg-primary/20">
            <Key className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl">Enter Completion Code</CardTitle>
        <CardDescription>
          Get the 6-digit code from the task poster to complete this task
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Info */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Task</span>
            <span className="text-sm font-semibold text-foreground">{taskTitle}</span>
          </div>
        </div>

        {/* Code Input */}
        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-medium">
            Verification Code
          </Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="text-center text-2xl font-bold tracking-widest h-14"
            maxLength={6}
            disabled={verifying || loading}
          />
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          disabled={code.length !== 6 || verifying || loading}
          className="w-full h-12 text-base"
        >
          {verifying ? (
            <>
              <span className="animate-pulse">Verifying...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Complete Task
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-accent-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Instructions:
            </p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Ask the task poster for the 6-digit completion code</li>
              <li>Enter the code in the field above</li>
              <li>Click "Complete Task" to finish</li>
              <li>Payment will be added to your wallet automatically</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CompletionCodeInputProps {
  taskId: string;
  taskTitle: string;
  onComplete: (code: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CompletionCodeInput({
  taskId,
  taskTitle,
  onComplete,
  isLoading = false,
}: CompletionCodeInputProps) {
  const [code, setCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(code);
      // Don't show success toast here - let the parent component handle it
    } catch (error) {
      toast.error('Invalid completion code. Please try again.');
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
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Complete Task</CardTitle>
        </div>
        <CardDescription>
          Enter the 6-digit code provided by the task poster
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="completion-code">Completion Code</Label>
            <Input
              id="completion-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
              maxLength={6}
              className="text-2xl font-mono tracking-wider text-center"
              disabled={isLoading || isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Ask the task poster for the 6-digit completion code
            </p>
          </div>

          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">Task Details</p>
            <p className="text-sm text-muted-foreground">{taskTitle}</p>
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={code.length !== 6 || isLoading || isSubmitting}
          >
            <CheckCircle className="h-4 w-4" />
            {isSubmitting ? 'Completing Task...' : 'Complete Task'}
          </Button>

          <div className="pt-2 border-t space-y-2">
            <p className="text-xs text-muted-foreground">
              ⚠️ <strong>Important:</strong> Only enter the code after completing the task to the poster's satisfaction.
            </p>
            <p className="text-xs text-muted-foreground">
              The code verifies that the task poster confirms your work is complete.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

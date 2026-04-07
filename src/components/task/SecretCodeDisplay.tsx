import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

interface SecretCodeDisplayProps {
  code: string;
  taskTitle: string;
  bondhuName?: string;
}

export default function SecretCodeDisplay({ code, taskTitle, bondhuName }: SecretCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border-primary/20 shadow-lg">
      <CardHeader className="text-center pb-3">
        <div className="flex justify-center mb-2">
          <div className="p-3 rounded-full bg-primary/20">
            <Key className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl">Task Completion Code</CardTitle>
        <CardDescription>
          Share this code with {bondhuName || 'your Bondhu'} to complete the task
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Code Display */}
        <div className="bg-white rounded-xl p-6 border-2 border-primary/20 shadow-md">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Verification Code</p>
            <div className="flex items-center justify-center gap-2">
              {code.split('').map((digit, index) => (
                <div
                  key={index}
                  className="w-12 h-14 flex items-center justify-center bg-primary/10 rounded-lg border-2 border-primary/30"
                >
                  <span className="text-3xl font-bold text-primary">{digit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copy Button */}
        <Button
          variant="outline"
          className="w-full border-primary/30 hover:bg-primary/10"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </>
          )}
        </Button>

        {/* Task Info */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Task</span>
            <span className="text-sm font-semibold text-foreground">{taskTitle}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-accent-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              How it works:
            </p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Share this 6-digit code with your Bondhu</li>
              <li>Bondhu enters the code to mark task complete</li>
              <li>You'll be prompted to rate and review</li>
              <li>Payment will be processed automatically</li>
            </ol>
          </div>
        </div>

        {/* Status */}
        <div className="flex justify-center">
          <Badge variant="outline" className="gap-2 border-primary/30 bg-primary/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Waiting for Completion
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

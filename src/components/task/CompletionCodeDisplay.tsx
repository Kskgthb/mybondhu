import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface CompletionCodeDisplayProps {
  code: string;
  taskTitle: string;
}

export default function CompletionCodeDisplay({ code, taskTitle }: CompletionCodeDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Task Completion Code</CardTitle>
        </div>
        <CardDescription>
          Share this code with your Bondhu to complete the task
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-background rounded-lg border-2 border-primary">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold font-mono tracking-wider text-primary">
                {code}
              </p>
              <p className="text-xs text-muted-foreground mt-1">6-Digit Code</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <p className="text-muted-foreground">
              Keep this code secure and only share it with your assigned Bondhu
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <p className="text-muted-foreground">
              The Bondhu must enter this code to mark the task as complete
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <p className="text-muted-foreground">
              Only provide the code after you're satisfied with the work
            </p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Task:</strong> {taskTitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

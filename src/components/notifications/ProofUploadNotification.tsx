/**
 * Proof Upload Notification Component
 * Shows a notification card when Bondhu uploads task completion proof
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Eye, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProofUploadNotificationProps {
  taskTitle: string;
  bondhuName: string;
  uploadedAt: string;
  proofUrl: string;
  onView: () => void;
  onDismiss?: () => void;
}

export default function ProofUploadNotification({
  taskTitle,
  bondhuName,
  uploadedAt,
  proofUrl,
  onView,
  onDismiss,
}: ProofUploadNotificationProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <p className="font-medium text-sm">Task Completion Proof Uploaded</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bondhuName} uploaded proof for "{taskTitle}"
                </p>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 flex-shrink-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                New
              </Badge>
            </div>

            {/* Thumbnail */}
            <div className="mt-2 mb-3">
              <img
                src={proofUrl}
                alt="Proof thumbnail"
                className="w-full h-32 object-cover rounded-md border"
              />
            </div>

            {/* Time */}
            <p className="text-xs text-muted-foreground mb-3">
              {formatDistanceToNow(new Date(uploadedAt), { addSuffix: true })}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onView}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Proof
              </Button>
              {onDismiss && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

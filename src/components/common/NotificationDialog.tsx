import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MapPin, PartyPopper } from 'lucide-react';
import { generateNotificationSound } from '@/lib/soundGenerator';

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'task_accepted' | 'bondhu_arrived' | 'task_completed';
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}

export default function NotificationDialog({
  open,
  onOpenChange,
  type,
  title,
  message,
  onAction,
  actionLabel
}: NotificationDialogProps) {
  
  useEffect(() => {
    if (open) {
      // Play sound when dialog opens
      const soundType = type === 'task_accepted' ? 'success' 
        : type === 'bondhu_arrived' ? 'arrival' 
        : 'completion';
      
      generateNotificationSound(soundType);
    }
  }, [open, type]);

  const getIcon = () => {
    switch (type) {
      case 'task_accepted':
        return <PartyPopper className="w-16 h-16 text-primary mx-auto mb-4" strokeWidth={2} />;
      case 'bondhu_arrived':
        return <MapPin className="w-16 h-16 text-secondary mx-auto mb-4" strokeWidth={2} />;
      case 'task_completed':
        return <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" strokeWidth={2} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="text-center">
            {getIcon()}
            <DialogTitle className="text-2xl font-bold mb-2">{title}</DialogTitle>
            <DialogDescription className="text-base">
              {message}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          {onAction && actionLabel && (
            <Button
              onClick={() => {
                onAction();
                onOpenChange(false);
              }}
              size="lg"
              className="w-full"
            >
              {actionLabel}
            </Button>
          )}
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

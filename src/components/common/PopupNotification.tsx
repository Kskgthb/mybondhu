import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, MapPin, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PopupNotificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'task_accepted' | 'bondhu_arrived' | 'task_completed';
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}

export default function PopupNotification({
  open,
  onOpenChange,
  type,
  title,
  message,
  onAction,
  actionLabel,
}: PopupNotificationProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (open) {
      // Play notification sound
      playNotificationSound(type);
    }
  }, [open, type]);

  const playNotificationSound = (notificationType: string) => {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different notification types
      if (notificationType === 'task_accepted') {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } else if (notificationType === 'bondhu_arrived') {
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        // Second beep
        setTimeout(() => {
          const oscillator2 = audioContext.createOscillator();
          const gainNode2 = audioContext.createGain();
          oscillator2.connect(gainNode2);
          gainNode2.connect(audioContext.destination);
          oscillator2.frequency.value = 800;
          gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator2.start(audioContext.currentTime);
          oscillator2.stop(audioContext.currentTime + 0.3);
        }, 400);
      } else if (notificationType === 'task_completed') {
        // Success sound - ascending tones
        [523, 659, 784].forEach((freq, index) => {
          setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.2);
          }, index * 150);
        });
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'task_accepted':
        return <CheckCircle2 className="h-16 w-16 text-primary" />;
      case 'bondhu_arrived':
        return <MapPin className="h-16 w-16 text-secondary" />;
      case 'task_completed':
        return <PartyPopper className="h-16 w-16 text-accent" />;
      default:
        return <CheckCircle2 className="h-16 w-16 text-primary" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'task_accepted':
        return 'bg-primary/10';
      case 'bondhu_arrived':
        return 'bg-secondary/10';
      case 'task_completed':
        return 'bg-accent/10';
      default:
        return 'bg-primary/10';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <div className={`flex flex-col items-center text-center space-y-4 py-6 ${getBackgroundColor()} rounded-lg -mx-6 -mt-6 px-6 pt-6`}>
          <div className="animate-bounce">
            {getIcon()}
          </div>
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl">{title}</DialogTitle>
            <DialogDescription className="text-base">
              {message}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Close
          </Button>
          {onAction && actionLabel && (
            <Button
              onClick={() => {
                onAction();
                onOpenChange(false);
              }}
              className="flex-1"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

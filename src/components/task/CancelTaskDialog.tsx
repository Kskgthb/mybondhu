import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { tasksApi } from '@/db/api';
import { toast } from 'sonner';

interface CancelTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  userId: string;
  onSuccess: () => void;
}

export default function CancelTaskDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  userId,
  onSuccess,
}: CancelTaskDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const result = await tasksApi.cancelTask(taskId, userId);
      
      if (result.success) {
        toast.success(result.message);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error('Failed to cancel task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Cancel Task</DialogTitle>
          </div>
          <DialogDescription className="space-y-2 pt-2">
            <p>Are you sure you want to cancel this task?</p>
            <p className="font-semibold text-foreground">"{taskTitle}"</p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The task will be permanently cancelled and removed from the available tasks list.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Keep Task
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

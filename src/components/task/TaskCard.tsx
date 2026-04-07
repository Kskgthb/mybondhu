import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, IndianRupee, AlertCircle, ExternalLink, Navigation, Edit, X } from 'lucide-react';
import type { Task, TaskWithDistance } from '@/types/types';
import { formatDistanceToNow } from 'date-fns';
import { getCategoryLabel, getCategoryIcon } from '@/lib/categories';

interface TaskCardProps {
  task: Task | TaskWithDistance;
  onView?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onNavigate?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
  showDistance?: boolean;
  showNavigate?: boolean;
  showEdit?: boolean;
  showCancel?: boolean;
}

const urgencyColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/20 text-info',
  high: 'bg-warning/20 text-warning',
  urgent: 'bg-destructive/20 text-destructive',
};

const statusColors = {
  pending: 'bg-accent/20 text-accent-foreground',
  accepted: 'bg-secondary/20 text-secondary',
  in_progress: 'bg-secondary/30 text-secondary',
  completed: 'bg-success/20 text-success',
  cancelled: 'bg-muted text-muted-foreground',
};

export default function TaskCard({ 
  task, 
  onView, 
  onAccept, 
  onDecline, 
  onNavigate,
  onEdit,
  onCancel,
  showActions = false, 
  showDistance = false,
  showNavigate = false,
  showEdit = false,
  showCancel = false
}: TaskCardProps) {
  const distance = 'distance_km' in task ? task.distance_km : null;
  const CategoryIcon = getCategoryIcon(task.category);
  const categoryLabel = getCategoryLabel(task.category);
  const googleMapsUrl = `https://www.google.com/maps?q=${task.location_lat},${task.location_lng}`;

  return (
    <Card className="hover:shadow-hover transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">{task.title}</CardTitle>
          <Badge className={urgencyColors[task.urgency]} variant="secondary">
            {task.urgency}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{task.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <a 
            href={googleMapsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="line-clamp-1 text-secondary hover:underline flex items-center gap-1"
          >
            <span>{task.location_address}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {showDistance && distance !== null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{distance.toFixed(1)} km away</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-secondary">
            <IndianRupee className="h-4 w-4" />
            <span>{task.amount}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="text-xs flex items-center gap-1">
            {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
            {categoryLabel}
          </Badge>
          <Badge className={statusColors[task.status]} variant="secondary">
            {task.status.replace('_', ' ')}
          </Badge>
          {task.payment_method && (
            <Badge variant="outline" className="text-xs">
              {task.payment_method === 'cash' ? '💵 Cash' : '💳 Online'}
            </Badge>
          )}
        </div>
      </CardContent>
      {(showActions || onView || showNavigate || showEdit || showCancel) && (
        <CardFooter className="flex gap-2 pt-3">
          {showCancel && onCancel && task.status === 'pending' && (
            <Button variant="destructive" className="flex-1" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          {showEdit && onEdit && task.status === 'pending' && (
            <Button variant="outline" className="flex-1" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {showNavigate && onNavigate && (
            <Button className="flex-1 bg-secondary hover:bg-secondary/90" onClick={onNavigate}>
              <Navigation className="h-4 w-4 mr-2" />
              Navigate
            </Button>
          )}
          {onView && (
            <Button variant="outline" className="flex-1" onClick={onView}>
              View Details
            </Button>
          )}
          {showActions && onAccept && (
            <Button className="flex-1 bg-secondary hover:bg-secondary/90" onClick={onAccept}>
              Accept
            </Button>
          )}
          {showActions && onDecline && (
            <Button variant="outline" className="flex-1" onClick={onDecline}>
              Decline
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

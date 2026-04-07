import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TaskCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4 bg-muted" />
            <Skeleton className="h-4 w-1/2 bg-muted" />
          </div>
          <Skeleton className="h-6 w-20 bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-5/6 bg-muted" />
        
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-24 bg-muted" />
          <Skeleton className="h-4 w-24 bg-muted" />
        </div>
        
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1 bg-muted" />
          <Skeleton className="h-9 flex-1 bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

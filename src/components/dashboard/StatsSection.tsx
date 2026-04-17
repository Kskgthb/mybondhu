import { Card, CardContent } from '@/components/ui/card';
import { Star, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';

interface StatsSectionProps {
  rating: number;
  completed: number;
  pending: number;
  declined: number;
}

export default function StatsSection({ rating, completed, pending, declined }: StatsSectionProps) {
  const stats = [
    {
      label: 'Avg Rating',
      value: rating.toFixed(1),
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      label: 'In Progress',
      value: pending,
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Declined',
      value: declined,
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className={`${stat.bg} ${stat.color} p-2 rounded-xl mb-3`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-tight">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

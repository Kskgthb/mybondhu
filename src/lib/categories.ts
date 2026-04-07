import { 
  GraduationCap, 
  User, 
  Calendar, 
  Truck, 
  Users, 
  Wrench, 
  Palette, 
  Dumbbell, 
  UtensilsCrossed, 
  Plane 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const categories: Category[] = [
  {
    value: 'academic_help',
    label: 'Academic Help',
    icon: GraduationCap,
  },
  {
    value: 'personal_task',
    label: 'Personal Task',
    icon: User,
  },
  {
    value: 'event_planning',
    label: 'Event Planning',
    icon: Calendar,
  },
  {
    value: 'moving_logistics',
    label: 'Moving & Logistics',
    icon: Truck,
  },
  {
    value: 'companionship',
    label: 'Companionship',
    icon: Users,
  },
  {
    value: 'technical_support',
    label: 'Technical Support',
    icon: Wrench,
  },
  {
    value: 'creative_services',
    label: 'Creative Services',
    icon: Palette,
  },
  {
    value: 'sports_fitness',
    label: 'Sports & Fitness',
    icon: Dumbbell,
  },
  {
    value: 'food_cooking',
    label: 'Food & Cooking',
    icon: UtensilsCrossed,
  },
  {
    value: 'travel_companion',
    label: 'Travel Companion',
    icon: Plane,
  },
];

export const getCategoryLabel = (value: string): string => {
  const category = categories.find(cat => cat.value === value);
  return category ? category.label : value;
};

export const getCategoryIcon = (value: string): LucideIcon | null => {
  const category = categories.find(cat => cat.value === value);
  return category ? category.icon : null;
};

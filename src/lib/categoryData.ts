import type { LucideIcon } from 'lucide-react';
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

export interface CategoryData {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  image: string;
  description: string;
}

export const categoryData: CategoryData[] = [
  {
    value: 'academic_help',
    label: 'Academic Help',
    icon: GraduationCap,
    color: '#3B82F6', // Blue
    bgColor: 'bg-blue-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86hvph3yo8ow.png',
    description: 'Get help with studies, tutoring, and assignments'
  },
  {
    value: 'personal_task',
    label: 'Personal Tasks',
    icon: User,
    color: '#8B5CF6', // Purple
    bgColor: 'bg-purple-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86hvoljgwf0g.png',
    description: 'Help with daily chores and errands'
  },
  {
    value: 'event_planning',
    label: 'Event Planning',
    icon: Calendar,
    color: '#EC4899', // Pink
    bgColor: 'bg-pink-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86hvpww7l14w.png',
    description: 'Organize fests, parties, and campus events'
  },
  {
    value: 'moving_logistics',
    label: 'Moving & Logistics',
    icon: Truck,
    color: '#F59E0B', // Amber
    bgColor: 'bg-amber-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86k4io8he4n4.jpg',
    description: 'Help with moving, shifting, and carrying'
  },
  {
    value: 'companionship',
    label: 'Companionship',
    icon: Users,
    color: '#10B981', // Emerald
    bgColor: 'bg-emerald-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86k4eae0dkao.jpg',
    description: 'Find friends for walks, chats, and hangouts'
  },
  {
    value: 'technical_support',
    label: 'Technical Support',
    icon: Wrench,
    color: '#6366F1', // Indigo
    bgColor: 'bg-indigo-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86hvph3ypgxs.png',
    description: 'Get tech help with laptops, phones, and gadgets'
  },
  {
    value: 'creative_services',
    label: 'Creative Services',
    icon: Palette,
    color: '#EF4444', // Red
    bgColor: 'bg-red-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86kdwaev84jk.jpg',
    description: 'Design, art, and creative project assistance'
  },
  {
    value: 'sports_fitness',
    label: 'Sports & Fitness',
    icon: Dumbbell,
    color: '#14B8A6', // Teal
    bgColor: 'bg-teal-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86k354kjk6bk.jpg',
    description: 'Find workout buddies and sports partners'
  },
  {
    value: 'food_cooking',
    label: 'Food & Cooking',
    icon: UtensilsCrossed,
    color: '#F97316', // Orange
    bgColor: 'bg-orange-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86k447cbn474.jpg',
    description: 'Cooking help and meal sharing'
  },
  {
    value: 'travel_companion',
    label: 'Travel Companion',
    icon: Plane,
    color: '#06B6D4', // Cyan
    bgColor: 'bg-cyan-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86k31makcu80.jpg',
    description: 'Find travel buddies and journey companions'
  },
];

export const getCategoryData = (value: string): CategoryData | undefined => {
  return categoryData.find(cat => cat.value === value);
};

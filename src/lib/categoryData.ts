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

export interface SubCategory {
  label: string;
  icon?: string; // Optional emoji or icon name
}

export interface CategoryData {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  image: string;
  description: string;
  subcategories: SubCategory[];
  emoji: string;
}

export const categoryData: CategoryData[] = [
  {
    value: 'academic_help',
    label: 'Academic',
    emoji: '🎓',
    icon: GraduationCap,
    color: '#3B82F6',
    bgColor: 'bg-blue-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86hvph3yo8ow.png',
    description: 'Get help with studies, tutoring, and assignments',
    subcategories: [
      { label: 'Homework Help' },
      { label: 'Assignment Writing' },
      { label: 'Exam Preparation' },
      { label: 'Notes Making' },
      { label: 'Doubt Solving' },
      { label: 'Online Tutoring' },
      { label: 'Project Guidance' },
      { label: 'Presentation Creation' },
      { label: 'Coding Help' },
      { label: 'Research Assistance' }
    ]
  },
  {
    value: 'creative_services',
    label: 'Creative',
    emoji: '🎨',
    icon: Palette,
    color: '#EF4444',
    bgColor: 'bg-red-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86kdwaev84jk.jpg',
    description: 'Design, art, and creative project assistance',
    subcategories: [
      { label: 'Graphic Design' },
      { label: 'Logo Creation' },
      { label: 'Video Editing' },
      { label: 'Content Writing' },
      { label: 'Social Media Posts' },
      { label: 'Photography' },
      { label: 'Music Composition' },
      { label: 'Drawing / Illustration' },
      { label: 'UI/UX Design' },
      { label: 'Creative Ideas Brainstorming' }
    ]
  },
  {
    value: 'sports_fitness',
    label: 'Sports & Fitness',
    emoji: '🏋️',
    icon: Dumbbell,
    color: '#14B8A6',
    bgColor: 'bg-teal-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86k354kjk6bk.jpg',
    description: 'Find workout buddies and sports partners',
    subcategories: [
      { label: 'Personal Training' },
      { label: 'Yoga Sessions' },
      { label: 'Home Workout Help' },
      { label: 'Diet & Nutrition Plan' },
      { label: 'Running Partner' },
      { label: 'Sports Coaching' },
      { label: 'Gym Assistance' },
      { label: 'Meditation Guidance' },
      { label: 'Weight Loss Plan' },
      { label: 'Injury Recovery Exercises' }
    ]
  },
  {
    value: 'travel_companion',
    label: 'Travel & Tour',
    emoji: '✈️',
    icon: Plane,
    color: '#06B6D4',
    bgColor: 'bg-cyan-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86k31makcu80.jpg',
    description: 'Find travel buddies and journey companions',
    subcategories: [
      { label: 'Trip Planning' },
      { label: 'Itinerary Creation' },
      { label: 'Local Guide' },
      { label: 'Hotel Booking Help' },
      { label: 'Transport Arrangement' },
      { label: 'Travel Companion' },
      { label: 'Budget Planning' },
      { label: 'Sightseeing Assistance' },
      { label: 'Ticket Booking Help' },
      { label: 'Packing Assistance' }
    ]
  },
  {
    value: 'food_cooking',
    label: 'Food & Cooking',
    emoji: '🍳',
    icon: UtensilsCrossed,
    color: '#F97316',
    bgColor: 'bg-orange-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86k447cbn474.jpg',
    description: 'Cooking help and meal sharing',
    subcategories: [
      { label: 'Home Cooking Help' },
      { label: 'Recipe Guidance' },
      { label: 'Meal Prep Assistance' },
      { label: 'Baking Help' },
      { label: 'Grocery Shopping' },
      { label: 'Diet Cooking' },
      { label: 'Catering Help' },
      { label: 'Kitchen Cleaning' },
      { label: 'Food Delivery Pickup' },
      { label: 'Cooking Classes' }
    ]
  },
  {
    value: 'companionship',
    label: 'Companionship',
    emoji: '🤝',
    icon: Users,
    color: '#10B981',
    bgColor: 'bg-emerald-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86k4eae0dkao.jpg',
    description: 'Find friends for walks, chats, and hangouts',
    subcategories: [
      { label: 'Friendly Chat' },
      { label: 'Event Companion' },
      { label: 'Travel Buddy' },
      { label: 'Movie Partner' },
      { label: 'Gaming Partner' },
      { label: 'Study Partner' },
      { label: 'Walking Companion' },
      { label: 'Emotional Support' },
      { label: 'Hobby Partner' },
      { label: 'Senior Assistance' }
    ]
  },
  {
    value: 'personal_task',
    label: 'Personal Tasks',
    emoji: '🧾',
    icon: User,
    color: '#8B5CF6',
    bgColor: 'bg-purple-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86hvoljgwf0g.png',
    description: 'Help with daily chores and errands',
    subcategories: [
      { label: 'Bill Payments' },
      { label: 'Document Work' },
      { label: 'Online Form Filling' },
      { label: 'Appointment Booking' },
      { label: 'Queue Standing' },
      { label: 'Personal Assistant' },
      { label: 'Errand Running' },
      { label: 'Reminder Setup' },
      { label: 'Shopping Help' },
      { label: 'Delivery Handling' }
    ]
  },
  {
    value: 'event_planning',
    label: 'Event Planning',
    emoji: '🎉',
    icon: Calendar,
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86hvpww7l14w.png',
    description: 'Organize fests, parties, and campus events',
    subcategories: [
      { label: 'Birthday Planning' },
      { label: 'Wedding Assistance' },
      { label: 'Decoration Setup' },
      { label: 'Vendor Management' },
      { label: 'Invitation Design' },
      { label: 'Catering Arrangement' },
      { label: 'Photography Booking' },
      { label: 'Event Coordination' },
      { label: 'Venue Setup' },
      { label: 'Guest Management' }
    ]
  },
  {
    value: 'moving_logistics',
    label: 'Moving',
    emoji: '🚚',
    icon: Truck,
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    image: 'https://miaoda-conversation-file.s3cdn.medo.dev/user-83dmrzia70g0/conv-83dmv202aiv4/20251212/file-86k4io8he4n4.jpg',
    description: 'Help with moving, shifting, and carrying',
    subcategories: [
      { label: 'Help Moving' },
      { label: 'Truck-Assisted Help Moving' },
      { label: 'Moving Logistics ✅' },
      { label: 'Trash & Furniture Removal' },
      { label: 'Heavy Lifting & Loading' },
      { label: 'Rearrange Furniture' },
      { label: 'Junk Haul Away' }
    ]
  },
  {
    value: 'trending',
    label: 'Trending',
    emoji: '🔥',
    icon: Users, // Temporary icon
    color: '#F43F5E',
    bgColor: 'bg-rose-50',
    image: '/trending-services.png',
    description: 'Popular services right now',
    subcategories: [
      { label: 'AI Tools Help' },
      { label: 'Social Media Growth' },
      { label: 'Influencer Collaboration' },
      { label: 'Content Creation Help' },
      { label: 'Resume Building' },
      { label: 'Freelancing Setup' },
      { label: 'Startup Ideas' },
      { label: 'Tech Setup Help' },
      { label: 'Online Earning Guidance' },
      { label: 'Portfolio Building' }
    ]
  }
];

export const getCategoryData = (value: string): CategoryData | undefined => {
  return categoryData.find(cat => cat.value === value);
};

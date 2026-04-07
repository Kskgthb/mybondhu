import { 
  Code, 
  Palette, 
  Camera, 
  Music, 
  Wrench, 
  Car, 
  GraduationCap, 
  Briefcase, 
  Heart, 
  Home,
  ShoppingBag,
  Utensils,
  Dumbbell,
  Laptop,
  Scissors,
  Truck
} from 'lucide-react';

export interface ExpertiseDomain {
  id: string;
  label: string;
  icon: typeof Code;
  description: string;
}

export const EXPERTISE_DOMAINS: ExpertiseDomain[] = [
  {
    id: 'tech',
    label: 'Tech & IT',
    icon: Code,
    description: 'Software, hardware, troubleshooting'
  },
  {
    id: 'design',
    label: 'Design & Creative',
    icon: Palette,
    description: 'Graphic design, UI/UX, branding'
  },
  {
    id: 'photography',
    label: 'Photography',
    icon: Camera,
    description: 'Event photography, editing'
  },
  {
    id: 'music',
    label: 'Music & Audio',
    icon: Music,
    description: 'Music lessons, audio editing'
  },
  {
    id: 'repair',
    label: 'Repair & Maintenance',
    icon: Wrench,
    description: 'Electronics, appliances, furniture'
  },
  {
    id: 'automotive',
    label: 'Automotive',
    icon: Car,
    description: 'Car repair, maintenance, washing'
  },
  {
    id: 'tutoring',
    label: 'Tutoring & Education',
    icon: GraduationCap,
    description: 'Academic subjects, test prep'
  },
  {
    id: 'business',
    label: 'Business Services',
    icon: Briefcase,
    description: 'Consulting, admin, data entry'
  },
  {
    id: 'health',
    label: 'Health & Wellness',
    icon: Heart,
    description: 'Fitness training, yoga, nutrition'
  },
  {
    id: 'home',
    label: 'Home Services',
    icon: Home,
    description: 'Cleaning, organizing, gardening'
  },
  {
    id: 'shopping',
    label: 'Shopping & Errands',
    icon: ShoppingBag,
    description: 'Grocery shopping, delivery'
  },
  {
    id: 'cooking',
    label: 'Cooking & Food',
    icon: Utensils,
    description: 'Meal prep, catering, baking'
  },
  {
    id: 'fitness',
    label: 'Fitness & Sports',
    icon: Dumbbell,
    description: 'Personal training, sports coaching'
  },
  {
    id: 'computer',
    label: 'Computer Skills',
    icon: Laptop,
    description: 'MS Office, data entry, typing'
  },
  {
    id: 'beauty',
    label: 'Beauty & Grooming',
    icon: Scissors,
    description: 'Haircut, makeup, styling'
  },
  {
    id: 'moving',
    label: 'Moving & Delivery',
    icon: Truck,
    description: 'Packing, moving, transportation'
  }
];

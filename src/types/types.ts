export type UserRole = 'need_bondhu' | 'bondhu' | 'admin';

export type TaskStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type TaskUrgency = 'low' | 'medium' | 'high' | 'urgent';

export type PaymentMethod = 'cash' | 'online';

export type PaymentStatus = 'pending' | 'completed' | 'failed';

export type NotificationType = 'task_posted' | 'task_accepted' | 'task_completed' | 'rating_received' | 'task_started';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type DocumentType = 'college_id' | 'photo' | 'aadhaar';

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  contact_no: string | null;
  id_number: string | null;
  role: UserRole;
  active_role: UserRole | null;
  avatar_url: string | null;
  availability_status: boolean;
  location_lat: number | null;
  location_lng: number | null;
  location_updated_at: string | null;
  rating_avg: number;
  total_tasks: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
  fcm_token: string | null;
  notification_enabled: boolean;
  full_name: string | null;
  college_name: string | null;
  campus_location: string | null;
  about: string | null;
  expertise: string[] | null;
  verification_status: VerificationStatus;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  photo_url: string | null;
  college: string | null;
  college_id_url: string | null;
  aadhaar_url: string | null;
  id_proof_url: string | null;
  expertise_categories: string[] | null;
  expertise_description: string | null;
  registration_completed: boolean;
  registration_step: number;
  upi_id: string | null;
  bondhu_coins: number;
  referral_code: string | null;
  referred_by: string | null;
  total_tasks_posted: number;
}

export interface Document {
  id: string;
  user_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  file_size: number;
  verified: boolean;
  uploaded_at: string;
  verified_at: string | null;
}

export interface BondhuSignupStep1 {
  full_name: string;
  email: string;
  phone: string;
  college_name: string;
  campus_location: string;
  about: string;
}

export interface BondhuSignupStep2 {
  college_id: File | null;
  photo: File | null;
  aadhaar: File | null;
}

export interface BondhuSignupStep3 {
  expertise: string[];
}

export interface BondhuSignupData {
  username: string;
  password: string;
  step1: BondhuSignupStep1;
  step2: BondhuSignupStep2;
  step3: BondhuSignupStep3;
  termsAccepted: boolean;
}

export interface BondhuRegistrationData {
  step1: {
    name: string;
    email: string;
    contact_no: string;
    college: string;
    campus_location: string;
    about: string;
  };
  step2: {
    photo: File | null;
    college_id: File | null;
    aadhaar: File | null;
  };
  step3: {
    expertise_categories: string[];
  };
  step4: {
    terms_accepted: boolean;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  urgency: TaskUrgency;
  amount: number;
  status: TaskStatus;
  poster_id: string;
  proof_url: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_qr_data: string | null;
  code_verified: boolean;
  code_verified_at: string | null;
  payment_verified: boolean;
  payment_verified_at: string | null;
  completion_step: 'pending' | 'code_verified' | 'payment_verified' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  bondhu_id: string;
  status: string;
  accepted_at: string;
  started_at: string | null;
  completed_at: string | null;
  completion_code: string | null;
  code_generated_at: string | null;
  proof_url: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  task_id: string;
  bondhu_id: string;
  poster_id: string;
  rating: number;
  review: string | null;
  feedback: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  task_id: string | null;
  read: boolean;
  created_at: string;
}

export interface TaskWithDistance extends Task {
  distance_km: number;
}

export interface TaskWithPoster extends Task {
  poster: Profile;
}

export interface TaskWithAssignment extends Task {
  assignment: TaskAssignment | null;
  bondhu: Profile | null;
}

export interface TaskWithRating extends Task {
  rating: Rating | null;
}

export interface TaskWithFullInfo extends Task {
  assignment: TaskAssignment | null;
  bondhu: Profile | null;
  rating: Rating | null;
}

export interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

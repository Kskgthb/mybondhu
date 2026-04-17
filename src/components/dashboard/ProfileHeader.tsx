import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/types/types';
import { User, Mail } from 'lucide-react';

interface ProfileHeaderProps {
  profile: Profile | null;
  role: string;
}

export default function ProfileHeader({ profile, role }: ProfileHeaderProps) {
  if (!profile) return null;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
      <Avatar className="h-24 w-24 border-4 border-white shadow-md">
        <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || profile.username} />
        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
          {profile.full_name?.[0] || profile.username?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-grow text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">{profile.full_name || profile.username}</h2>
          <Badge variant="secondary" className="w-fit mx-auto md:mx-0 bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1">
            {role === 'bondhu' ? 'Bondhu Helper' : 'Bondhu Requester'}
          </Badge>
        </div>
        
        <div className="flex flex-col gap-1 text-sm text-gray-600">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Mail className="h-4 w-4 text-primary/60" />
            <span>{profile.email}</span>
          </div>
          {profile.college_name && (
             <div className="flex items-center justify-center md:justify-start gap-2">
               <span className="font-medium text-primary/80">{profile.college_name}</span>
             </div>
          )}
        </div>
      </div>
      
      <div className="text-center md:text-right hidden sm:block">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
        <div className="flex items-center justify-center md:justify-end gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${profile.availability_status ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-sm font-medium text-gray-700">
            {profile.availability_status ? 'Available' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}

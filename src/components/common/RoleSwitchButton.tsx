import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, Users } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RoleSwitchButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export default function RoleSwitchButton({ 
  variant = 'outline', 
  size = 'default',
  showLabel = true 
}: RoleSwitchButtonProps) {
  const { currentRole, switchRole, isSwitching } = useRole();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Don't show for admin users or if profile is not loaded
  if (!profile || profile.role === 'admin') {
    return null;
  }

  const handleSwitch = async () => {
    // Determine the target role before switching
    const targetRole = currentRole === 'need_bondhu' ? 'bondhu' : 'need_bondhu';
    
    // Switch the role in the database
    await switchRole();
    
    // Navigate to the appropriate dashboard after switching
    if (targetRole === 'bondhu') {
      navigate('/bondhu/dashboard');
    } else {
      navigate('/need-bondhu/dashboard');
    }
  };

  const targetRole = currentRole === 'need_bondhu' ? 'Bondhu' : 'Need Bondhu';
  const targetIcon = currentRole === 'need_bondhu' ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />;

  if (size === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size="icon"
              onClick={handleSwitch}
              disabled={isSwitching}
              className="relative"
            >
              {isSwitching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                targetIcon
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch to {targetRole} mode</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSwitch}
      disabled={isSwitching}
      className="gap-2"
    >
      {isSwitching ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        targetIcon
      )}
      {showLabel && (
        <span>
          {isSwitching ? 'Switching...' : `Switch to ${targetRole}`}
        </span>
      )}
    </Button>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface RoleToggleProps {
  currentMode: 'need_bondhu' | 'bondhu';
}

export default function RoleToggle({ currentMode }: RoleToggleProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleToggle = async (newMode: 'need_bondhu' | 'bondhu') => {
    // Don't do anything if clicking the current mode
    if (newMode === currentMode) return;

    setChecking(true);

    try {
      // Allow switching to both modes without forced registration
      // Registration will be checked on the dashboard itself
      if (newMode === 'bondhu') {
        toast.success('Switching to Bondhu Helper Mode', {
          description: 'Explore helper features and accept tasks.',
          duration: 2000,
        });
        
        setTimeout(() => {
          navigate('/bondhu/dashboard');
        }, 500);
      } else {
        // Switching to Need Bondhu mode (task poster)
        toast.success('Switching to Task Poster Mode', {
          description: 'You can now post tasks and find helpers nearby.',
          duration: 2000,
        });
        
        setTimeout(() => {
          navigate('/need-bondhu/dashboard');
        }, 500);
      }
    } catch (error) {
      console.error('Error toggling role:', error);
      toast.error('Failed to switch mode', {
        description: 'Please try again or contact support if the issue persists.',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm border-primary/20 shadow-md">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-sm font-semibold mb-1 text-foreground">Switch Mode</h3>
          <p className="text-xs text-muted-foreground">
            {currentMode === 'bondhu' 
              ? 'Currently in Helper mode - Accept tasks and earn money' 
              : 'Currently in Poster mode - Post tasks and get help'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={currentMode === 'need_bondhu' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToggle('need_bondhu')}
            disabled={checking}
            className="gap-2 min-w-[130px]"
          >
            <Users className="h-4 w-4" />
            {checking && currentMode === 'bondhu' ? (
              <span className="flex items-center gap-1">
                <span className="animate-pulse">Switching...</span>
              </span>
            ) : (
              'Need Bondhu'
            )}
          </Button>
          
          <Button
            variant={currentMode === 'bondhu' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToggle('bondhu')}
            disabled={checking}
            className="gap-2 min-w-[140px]"
          >
            <UserCheck className="h-4 w-4" />
            {checking && currentMode === 'need_bondhu' ? (
              <span className="flex items-center gap-1">
                <span className="animate-pulse">Checking...</span>
              </span>
            ) : (
              'Become Bondhu'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

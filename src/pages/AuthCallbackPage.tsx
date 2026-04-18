import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';


export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!existingProfile) {
            // Create profile for new Google user
            const username = session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`;
            const email = session.user.email || '';
            
            const savedRole = localStorage.getItem('signup_role');
            const roleToAssign = savedRole || 'need_bondhu';
            
            // Clean up localStorage
            if (savedRole) {
              localStorage.removeItem('signup_role');
            }

            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                username: username,
                email: email,
                role: roleToAssign, // Use saved role or default to 'need_bondhu'
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
              throw new Error('Failed to create user profile');
            }

            toast.success('🎉 Welcome to BondhuApp! Account created successfully.');
          } else {
            toast.success('✅ Signed in successfully!');
          }

          // Redirect based on role
          if (existingProfile?.role === 'bondhu') {
            navigate('/bondhu/dashboard', { replace: true });
          } else {
            navigate('/need-bondhu/dashboard', { replace: true });
          }
        } else {
          throw new Error('No session found');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        toast.error('Authentication failed. Please try again.');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">

        <div className="relative z-10 text-center">
          <div className="text-destructive mb-4">
            <p className="text-lg font-semibold">Authentication Error</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">

      <div className="relative z-10 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-lg font-semibold">Completing sign in...</p>
        <p className="text-sm text-muted-foreground mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  );
}

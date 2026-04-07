import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, UserCheck, HandHeart, Mail, Phone } from 'lucide-react';
import Logo from '@/components/common/Logo';
import CampusBackground from '@/components/common/CampusBackground';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'need_bondhu' | 'bondhu'>('need_bondhu');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'bondhu') {
      navigate('/signup/bondhu');
    }
  }, [role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }

    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!phone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.replace(/[\s-]/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!password) {
      toast.error('Please enter a password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signUp(username, password, role, email, phone);
      
      // Show success message with role-specific information
      if (role === 'bondhu') {
        toast.success('🎉 Registration Complete! Welcome to BondhuApp family!', {
          description: 'You can now start accepting tasks and earning money.',
          duration: 5000,
        });
      } else {
        toast.success('🎉 Registration Complete! Welcome to BondhuApp!', {
          description: 'You can now post tasks and get instant help.',
          duration: 5000,
        });
      }
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Please sign in with your new account',
            username: username 
          } 
        });
      }, 2000);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Provide specific error messages
      if (error.message?.includes('email') && error.message?.includes('already')) {
        toast.error('This email is already registered. Please use a different email or try logging in.');
      } else if (error.message?.includes('phone') && error.message?.includes('already')) {
        toast.error('This phone number is already registered. Please use a different number or try logging in.');
      } else if (error.message?.includes('Password')) {
        toast.error('Password must be at least 6 characters long.');
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <CampusBackground />
      <div className="w-full max-w-4xl relative z-10">
        {/* Join Us Banner */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-accent/20 bg-white/80 backdrop-blur-sm max-w-md">
            <img 
              src="/join-us.jpg" 
              alt="Join Us - Become part of the Bondhu community" 
              className="w-full h-auto object-contain"
              loading="eager"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>

        <Card className="w-full max-w-md mx-auto shadow-card bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showBorder showTagline className="rounded-[1.5rem]" />
            </div>
            <CardTitle className="text-2xl font-bold">Join BondhuApp</CardTitle>
            <CardDescription>Create your account to get started</CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, and underscores allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                autoComplete="tel"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                10-digit mobile number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-3">
              <Label>I want to</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as 'need_bondhu' | 'bondhu')}>
                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="need_bondhu" id="need_bondhu" />
                  <Label htmlFor="need_bondhu" className="flex items-center gap-3 cursor-pointer flex-1">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Need Help</div>
                      <div className="text-xs text-muted-foreground">Post tasks and get instant help</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="bondhu" id="bondhu" />
                  <Label htmlFor="bondhu" className="flex items-center gap-3 cursor-pointer flex-1">
                    <HandHeart className="h-5 w-5 text-secondary" />
                    <div>
                      <div className="font-medium">Become a Helper</div>
                      <div className="text-xs text-muted-foreground">Accept tasks and earn money</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  FileText,
  Upload,
  Camera,
  IdCard,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Gift
} from 'lucide-react';
import { EXPERTISE_DOMAINS } from '@/constants/expertise';
import { BondhuSignupData, BondhuSignupStep1, BondhuSignupStep2, BondhuSignupStep3 } from '@/types/types';
import { uploadDocument, formatFileSize, UploadProgress } from '@/utils/fileUpload';
import { supabase } from '@/db/supabase';

export default function BondhuSignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [referralCode, setReferralCode] = useState('');
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to registration page
  useEffect(() => {
    if (user) {
      toast.info('You are already logged in. Redirecting to complete your profile...');
      navigate('/register/bondhu');
    }
  }, [user, navigate]);

  // Handle referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [step1Data, setStep1Data] = useState<BondhuSignupStep1>({
    full_name: '',
    email: '',
    phone: '',
    college_name: '',
    campus_location: '',
    about: ''
  });

  const [step2Data, setStep2Data] = useState<BondhuSignupStep2>({
    college_id: null,
    photo: null,
    aadhaar: null
  });

  const [step3Data, setStep3Data] = useState<BondhuSignupStep3>({
    expertise: []
  });

  const [termsAccepted, setTermsAccepted] = useState(false);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const validateStep1 = (): boolean => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return false;
    }

    if (!password) {
      toast.error('Please enter a password');
      return false;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (!step1Data.full_name.trim()) {
      toast.error('Please enter your full name');
      return false;
    }

    if (!step1Data.email.trim()) {
      toast.error('Please enter your email address');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1Data.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!step1Data.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }

    if (!/^[0-9]{10}$/.test(step1Data.phone.replace(/[\s-]/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }

    if (!step1Data.college_name.trim()) {
      toast.error('Please enter your college name');
      return false;
    }

    if (!step1Data.campus_location.trim()) {
      toast.error('Please enter your campus location');
      return false;
    }

    if (!step1Data.about.trim()) {
      toast.error('Please tell us about yourself');
      return false;
    }

    if (step1Data.about.length < 50) {
      toast.error('Please write at least 50 characters about yourself');
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!step2Data.college_id) {
      toast.error('Please upload your college ID');
      return false;
    }

    if (!step2Data.photo) {
      toast.error('Please upload your photo');
      return false;
    }

    if (!step2Data.aadhaar) {
      toast.error('Please upload your Aadhaar card');
      return false;
    }

    return true;
  };

  const validateStep3 = (): boolean => {
    if (step3Data.expertise.length === 0) {
      toast.error('Please select at least one expertise domain');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileChange = (type: keyof BondhuSignupStep2, file: File | null) => {
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPEG, PNG, WEBP, and PDF files are allowed');
        return;
      }
    }

    setStep2Data(prev => ({ ...prev, [type]: file }));
  };

  const toggleExpertise = (expertiseId: string) => {
    setStep3Data(prev => {
      const expertise = prev.expertise.includes(expertiseId)
        ? prev.expertise.filter(id => id !== expertiseId)
        : [...prev.expertise, expertiseId];
      return { ...prev, expertise };
    });
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      // Check if referral code is valid
      let referredBy: string | null = null;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode.toUpperCase())
          .maybeSingle();
        
        if (referrer) {
          referredBy = referrer.id;
        } else {
          setLoading(false);
          toast.error('Invalid referral code. Please check and try again, or leave it blank.');
          return;
        }
      }

      // Username is no longer unique - multiple users can have the same username
      // Only email and phone are checked for uniqueness (handled by database constraints)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: step1Data.email,
        password: password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const userId = authData.user.id;

      const collegeIdUrl = await uploadDocument(
        step2Data.college_id!,
        userId,
        'college_id',
        (progress) => setUploadProgress(prev => ({ ...prev, college_id: progress }))
      );

      const photoUrl = await uploadDocument(
        step2Data.photo!,
        userId,
        'photo',
        (progress) => setUploadProgress(prev => ({ ...prev, photo: progress }))
      );

      const aadhaarUrl = await uploadDocument(
        step2Data.aadhaar!,
        userId,
        'aadhaar',
        (progress) => setUploadProgress(prev => ({ ...prev, aadhaar: progress }))
      );

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: username,
          email: step1Data.email,
          phone: step1Data.phone,
          full_name: step1Data.full_name,
          college_name: step1Data.college_name,
          campus_location: step1Data.campus_location,
          about: step1Data.about,
          expertise: step3Data.expertise,
          role: 'bondhu',
          verification_status: 'pending',
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          referred_by: referredBy,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      const documents = [
        { user_id: userId, document_type: 'college_id', file_url: collegeIdUrl, file_name: step2Data.college_id!.name, file_size: step2Data.college_id!.size },
        { user_id: userId, document_type: 'photo', file_url: photoUrl, file_name: step2Data.photo!.name, file_size: step2Data.photo!.size },
        { user_id: userId, document_type: 'aadhaar', file_url: aadhaarUrl, file_name: step2Data.aadhaar!.name, file_size: step2Data.aadhaar!.size }
      ];

      const { error: docsError } = await supabase
        .from('documents')
        .insert(documents);

      if (docsError) throw docsError;

      // Show success message
      toast.success('🎉 Registration Complete! Welcome to BondhuApp!', {
        description: 'Your account has been created successfully. Redirecting to your dashboard...',
        duration: 3000,
      });
      
      // Wait a moment for the user to see the success message, then redirect to Bondhu dashboard
      setTimeout(() => {
        navigate('/bondhu/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        toast.error('This email is already registered. Please sign in instead.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.message?.includes('email') && error.message?.includes('already')) {
        toast.error('This email is already registered. Please use a different email or try logging in.');
      } else if (error.message?.includes('password')) {
        toast.error('Password must be at least 6 characters');
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username *</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="username"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Only letters, numbers, and underscores allowed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="full_name"
            type="text"
            placeholder="Enter your full name"
            value={step1Data.full_name}
            onChange={(e) => setStep1Data(prev => ({ ...prev, full_name: e.target.value }))}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={step1Data.email}
            onChange={(e) => setStep1Data(prev => ({ ...prev, email: e.target.value }))}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Contact Number *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="10-digit phone number"
            value={step1Data.phone}
            onChange={(e) => setStep1Data(prev => ({ ...prev, phone: e.target.value }))}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="college_name">College Name *</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="college_name"
            type="text"
            placeholder="Enter your college/university name"
            value={step1Data.college_name}
            onChange={(e) => setStep1Data(prev => ({ ...prev, college_name: e.target.value }))}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campus_location">Campus Location *</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="campus_location"
            type="text"
            placeholder="City, State"
            value={step1Data.campus_location}
            onChange={(e) => setStep1Data(prev => ({ ...prev, campus_location: e.target.value }))}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="about">About Yourself * (min. 50 characters)</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea
            id="about"
            placeholder="Tell us about yourself, your skills, and why you want to be a Bondhu..."
            value={step1Data.about}
            onChange={(e) => setStep1Data(prev => ({ ...prev, about: e.target.value }))}
            className="pl-10 min-h-[120px]"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {step1Data.about.length}/50 characters
        </p>
      </div>

      <div className="space-y-2 pt-2 border-t border-border mt-4">
        <Label htmlFor="referralCode" className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Referral Code (Optional)
        </Label>
        <Input
          id="referralCode"
          type="text"
          placeholder="Enter referral code"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          className="uppercase"
        />
        <p className="text-[10px] text-muted-foreground">
          Enter a code to help a friend earn Bondhu Coins!
        </p>
      </div>
    </div>
  );

  const renderFileUpload = (
    type: keyof BondhuSignupStep2,
    label: string,
    icon: typeof Upload,
    accept: string = 'image/*,application/pdf'
  ) => {
    const file = step2Data[type];
    const progress = uploadProgress[type];
    const Icon = icon;

    return (
      <div className="space-y-2">
        <Label htmlFor={type}>{label} *</Label>
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
          <input
            id={type}
            type="file"
            accept={accept}
            onChange={(e) => handleFileChange(type, e.target.files?.[0] || null)}
            className="hidden"
          />
          <label htmlFor={type} className="cursor-pointer">
            <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                {progress && progress.status !== 'completed' && (
                  <div className="mt-2">
                    <Progress value={progress.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{progress.message}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">Max 5MB • JPEG, PNG, WEBP, PDF</p>
              </div>
            )}
          </label>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-lg mb-4">
        <p className="text-sm text-muted-foreground">
          Upload clear, readable documents for verification. All documents are securely stored and only accessible by you and administrators.
        </p>
      </div>

      {renderFileUpload('college_id', 'College ID Card', IdCard)}
      {renderFileUpload('photo', 'Your Photo', Camera)}
      {renderFileUpload('aadhaar', 'Aadhaar Card', CreditCard)}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-lg mb-4">
        <p className="text-sm text-muted-foreground">
          Select your areas of expertise. This helps us match you with relevant tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {EXPERTISE_DOMAINS.map((domain) => {
          const Icon = domain.icon;
          const isSelected = step3Data.expertise.includes(domain.id);

          return (
            <div
              key={domain.id}
              onClick={() => toggleExpertise(domain.id)}
              className={`
                border-2 rounded-lg p-4 cursor-pointer transition-all
                ${isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{domain.label}</h4>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{domain.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center mt-4">
        Selected: {step3Data.expertise.length} domain{step3Data.expertise.length !== 1 ? 's' : ''}
      </p>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Terms and Conditions
        </h3>
        
        <div className="max-h-[300px] overflow-y-auto text-sm text-muted-foreground space-y-2 border rounded p-4 bg-muted/30">
          <p><strong>1. Acceptance of Terms</strong></p>
          <p>By joining as a Bondhu, you agree to provide reliable and quality service to users who need help.</p>
          
          <p><strong>2. Verification</strong></p>
          <p>All documents submitted will be verified by our team. False information may result in account suspension.</p>
          
          <p><strong>3. Service Standards</strong></p>
          <p>You agree to maintain professional conduct, arrive on time, and complete tasks as agreed.</p>
          
          <p><strong>4. Payment</strong></p>
          <p>Payment will be processed after task completion and confirmation by the task poster.</p>
          
          <p><strong>5. Privacy</strong></p>
          <p>Your personal information and documents are securely stored and will not be shared with third parties without consent.</p>
          
          <p><strong>6. Liability</strong></p>
          <p>You are responsible for your actions while performing tasks. Bondhu is not liable for any damages or injuries.</p>
          
          <p><strong>7. Account Termination</strong></p>
          <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activities.</p>
          
          <p><strong>8. Changes to Terms</strong></p>
          <p>We may update these terms from time to time. Continued use of the platform constitutes acceptance of updated terms.</p>
        </div>

        <div className="flex items-start gap-3 pt-4">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
            I have read and agree to the Terms and Conditions. I confirm that all information provided is accurate and I understand that my documents will be verified.
          </Label>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium">What happens next?</p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Your account will be created with "Pending Verification" status</li>
          <li>Our team will review your documents within 24-48 hours</li>
          <li>You'll receive a notification once verification is complete</li>
          <li>After verification, you can start accepting tasks</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">Join as Bondhu</CardTitle>
              <CardDescription>Step {currentStep} of {totalSteps}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex-1"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !termsAccepted}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Registration
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

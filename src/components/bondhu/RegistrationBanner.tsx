import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, FileText, Image, CreditCard } from 'lucide-react';
import { supabase } from '@/db/supabase';

export default function RegistrationBanner() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [registrationStatus, setRegistrationStatus] = useState<{
    isComplete: boolean;
    missingItems: string[];
    loading: boolean;
  }>({
    isComplete: true,
    missingItems: [],
    loading: true,
  });

  useEffect(() => {
    checkRegistrationStatus();
  }, [profile?.id]);

  const checkRegistrationStatus = async () => {
    if (!profile?.id) {
      setRegistrationStatus({ isComplete: false, missingItems: ['Profile'], loading: false });
      return;
    }

    try {
      // Check for required documents
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('document_type')
        .eq('user_id', profile.id);

      if (docsError) {
        console.error('Error checking documents:', docsError);
        setRegistrationStatus({ isComplete: false, missingItems: ['Unable to verify'], loading: false });
        return;
      }

      const requiredDocs = ['college_id', 'photo', 'aadhaar'];
      const uploadedDocs = documents?.map(doc => doc.document_type) || [];
      const missingDocs = requiredDocs.filter(doc => !uploadedDocs.includes(doc));

      const missingItems: string[] = [];
      
      if (missingDocs.includes('photo')) missingItems.push('Profile Photo');
      if (missingDocs.includes('college_id')) missingItems.push('College ID');
      if (missingDocs.includes('aadhaar')) missingItems.push('Aadhaar Card');
      
      if (!profile.terms_accepted) {
        missingItems.push('Terms & Conditions');
      }

      setRegistrationStatus({
        isComplete: missingItems.length === 0,
        missingItems,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking registration:', error);
      setRegistrationStatus({ isComplete: false, missingItems: ['Error checking status'], loading: false });
    }
  };

  if (registrationStatus.loading) {
    return null; // Don't show anything while loading
  }

  if (registrationStatus.isComplete) {
    return null; // Don't show banner if registration is complete
  }

  return (
    <Alert className="mb-6 border-2 border-warning/50 bg-gradient-to-r from-warning/10 to-warning/5 dark:from-warning/20 dark:to-warning/10">
      <AlertCircle className="h-5 w-5 text-warning" />
      <AlertTitle className="text-lg font-semibold text-foreground mb-2">
        Complete Your Bondhu Registration
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-muted-foreground">
          You need to complete your registration to accept tasks and start earning. Missing items:
        </p>
        
        <ul className="space-y-2 ml-4">
          {registrationStatus.missingItems.map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-foreground">
              {item === 'Profile Photo' && <Image className="h-4 w-4" />}
              {item === 'College ID' && <FileText className="h-4 w-4" />}
              {item === 'Aadhaar Card' && <CreditCard className="h-4 w-4" />}
              {item === 'Terms & Conditions' && <CheckCircle className="h-4 w-4" />}
              <span className="font-medium">{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-3 mt-4">
          <Button
            onClick={() => navigate('/signup/bondhu')}
            className="bg-warning hover:bg-warning/90 text-white"
          >
            Complete Registration Now
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/need-bondhu/dashboard')}
          >
            Post Tasks Instead
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

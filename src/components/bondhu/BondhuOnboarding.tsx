import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Upload, FileText, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BondhuRegistrationData } from '@/types/types';
import { updateBondhuProfile, uploadDocument } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';

const TASK_CATEGORIES = [
  'Delivery & Pickup',
  'Academic Help',
  'Tech Support',
  'Event Assistance',
  'Moving & Transport',
  'Shopping & Errands',
  'Tutoring',
  'Photography',
  'Design & Creative',
  'Other Services'
];

const BONDHU_TERMS = [
  {
    title: 'Eligibility',
    content: 'You must be above 18 (or valid student age as per local rules), possess a valid ID, and provide accurate personal details, college info, and verification documents.'
  },
  {
    title: 'Authenticity & Behavior',
    content: 'You must maintain honest, respectful, and professional behavior with all users. Misconduct, harassment, fraud, or misuse of the platform is strictly prohibited.'
  },
  {
    title: 'Task Responsibility',
    content: 'Once you accept a task, you must complete it safely, responsibly, and within the expected time. You cannot cancel without a genuine reason.'
  },
  {
    title: 'Earnings & Payments',
    content: 'All payments will be processed via the Bondhu system. Any attempt to bypass the platform for personal payment is not allowed.'
  },
  {
    title: 'Safety & Compliance',
    content: 'You must follow all safety guidelines, avoid risky activities, and comply with local laws. Bondhu is not responsible for actions done outside the app\'s terms.'
  },
  {
    title: 'Ratings & Feedback',
    content: 'You agree to receive ratings for each task. Repeated low ratings or complaints may lead to suspension or permanent removal.'
  },
  {
    title: 'No Misrepresentation',
    content: 'You must not pretend to be someone else, provide false documents, or mislead users.'
  },
  {
    title: 'Account Integrity',
    content: 'Keep your account secure. Sharing your account or misuse can lead to immediate termination.'
  },
  {
    title: 'Platform Rights',
    content: 'Bondhu may verify your identity, monitor task quality, suspend accounts, or modify policies when necessary.'
  },
  {
    title: 'Liability Limits',
    content: 'The platform only connects users and helpers. You\'re responsible for your actions during tasks.'
  }
];

export default function BondhuOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<BondhuRegistrationData>({
    step1: {
      name: '',
      email: user?.email || '',
      contact_no: '',
      college: '',
      campus_location: '',
      about: ''
    },
    step2: {
      photo: null,
      college_id: null,
      aadhaar: null
    },
    step3: {
      expertise_categories: []
    },
    step4: {
      terms_accepted: false
    }
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [collegeIdPreview, setCollegeIdPreview] = useState<string | null>(null);
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleFileChange = (field: 'photo' | 'college_id' | 'aadhaar', file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    if (/[\u4e00-\u9fa5]/.test(file.name)) {
      toast.error('Filename must not contain Chinese characters');
      return;
    }

    setFormData(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        [field]: file
      }
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (field === 'photo') setPhotoPreview(result);
      else if (field === 'college_id') setCollegeIdPreview(result);
      else if (field === 'aadhaar') setAadhaarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    const { name, email, contact_no, college, campus_location, about } = formData.step1;
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!contact_no.trim() || !/^\d{10}$/.test(contact_no)) {
      toast.error('Please enter a valid 10-digit contact number');
      return false;
    }
    if (!college.trim()) {
      toast.error('Please enter your college name');
      return false;
    }
    if (!campus_location.trim()) {
      toast.error('Please enter your campus location');
      return false;
    }
    if (!about.trim() || about.trim().length < 20) {
      toast.error('Please write at least 20 characters about yourself');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const { photo, college_id, aadhaar } = formData.step2;
    
    if (!photo) {
      toast.error('Please upload your photo');
      return false;
    }
    if (!college_id) {
      toast.error('Please upload your college ID');
      return false;
    }
    if (!aadhaar) {
      toast.error('Please upload your Aadhaar card');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.step3.expertise_categories.length === 0) {
      toast.error('Please select at least one expertise category');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.step4.terms_accepted) {
      toast.error('Please accept the terms and conditions to continue');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep4() || !user) return;

    setIsSubmitting(true);
    try {
      const photoUrl = formData.step2.photo 
        ? await uploadDocument(user.id, formData.step2.photo, 'photo')
        : null;
      
      const collegeIdUrl = formData.step2.college_id
        ? await uploadDocument(user.id, formData.step2.college_id, 'college_id')
        : null;
      
      const aadhaarUrl = formData.step2.aadhaar
        ? await uploadDocument(user.id, formData.step2.aadhaar, 'aadhaar')
        : null;

      await updateBondhuProfile(user.id, {
        username: formData.step1.name,
        email: formData.step1.email,
        contact_no: formData.step1.contact_no,
        college: formData.step1.college,
        campus_location: formData.step1.campus_location,
        about: formData.step1.about,
        photo_url: photoUrl,
        college_id_url: collegeIdUrl,
        aadhaar_url: aadhaarUrl,
        expertise_categories: formData.step3.expertise_categories,
        terms_accepted: formData.step4.terms_accepted,
        terms_accepted_at: new Date().toISOString(),
        registration_completed: true,
        registration_step: 4
      });

      toast.success('Registration completed successfully!');
      navigate('/bondhu/dashboard');
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error('Failed to complete registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      step3: {
        expertise_categories: prev.step3.expertise_categories.includes(category)
          ? prev.step3.expertise_categories.filter(c => c !== category)
          : [...prev.step3.expertise_categories, category]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo-new.png" 
              alt="Bondhu Logo" 
              className="h-20 xl:h-24 w-auto object-contain"
              onError={(e) => {
                console.error('Logo failed to load');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Become a Bondhu</h1>
          <p className="text-muted-foreground">Complete your profile to start helping others</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step < currentStep 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : step === currentStep 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'bg-background border-border text-muted-foreground'
                }`}>
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                <span className="text-xs mt-2 text-center text-muted-foreground">
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Documents'}
                  {step === 3 && 'Expertise'}
                  {step === 4 && 'Terms'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === 1 && 'Basic Information'}
                  {currentStep === 2 && 'Document Verification'}
                  {currentStep === 3 && 'Your Expertise'}
                  {currentStep === 4 && 'Terms & Conditions'}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 && 'Tell us about yourself'}
                  {currentStep === 2 && 'Upload your verification documents'}
                  {currentStep === 3 && 'Select your areas of expertise'}
                  {currentStep === 4 && 'Review and accept our terms'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={formData.step1.name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          step1: { ...prev.step1, name: e.target.value }
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.step1.email}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          step1: { ...prev.step1, email: e.target.value }
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_no">Contact Number *</Label>
                      <Input
                        id="contact_no"
                        type="tel"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        value={formData.step1.contact_no}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setFormData(prev => ({
                            ...prev,
                            step1: { ...prev.step1, contact_no: value }
                          }));
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="college">College Name *</Label>
                      <Input
                        id="college"
                        placeholder="Enter your college/university name"
                        value={formData.step1.college}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          step1: { ...prev.step1, college: e.target.value }
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="campus_location">Campus Location *</Label>
                      <Input
                        id="campus_location"
                        placeholder="Enter campus location/address"
                        value={formData.step1.campus_location}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          step1: { ...prev.step1, campus_location: e.target.value }
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="about">About Yourself *</Label>
                      <Textarea
                        id="about"
                        placeholder="Tell us about yourself, your skills, and why you want to become a Bondhu (minimum 20 characters)"
                        rows={4}
                        value={formData.step1.about}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          step1: { ...prev.step1, about: e.target.value }
                        }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.step1.about.length} / 20 characters minimum
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Document Guidelines</p>
                          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                            <li>• Maximum file size: 5MB per document</li>
                            <li>• Accepted formats: JPG, PNG, WEBP</li>
                            <li>• Ensure documents are clear and readable</li>
                            <li>• Filenames must not contain special characters</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="photo">Your Photo *</Label>
                      <div className="mt-2">
                        {photoPreview ? (
                          <div className="relative">
                            <img 
                              src={photoPreview} 
                              alt="Preview" 
                              className="w-32 h-32 object-cover rounded-lg border-2 border-border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  step2: { ...prev.step2, photo: null }
                                }));
                                setPhotoPreview(null);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Click to upload photo</span>
                            <input
                              id="photo"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="college_id">College ID Card *</Label>
                      <div className="mt-2">
                        {collegeIdPreview ? (
                          <div className="relative">
                            <img 
                              src={collegeIdPreview} 
                              alt="College ID Preview" 
                              className="w-full max-w-md h-48 object-contain rounded-lg border-2 border-border bg-muted"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  step2: { ...prev.step2, college_id: null }
                                }));
                                setCollegeIdPreview(null);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Click to upload college ID</span>
                            <input
                              id="college_id"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange('college_id', e.target.files?.[0] || null)}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="aadhaar">Aadhaar Card *</Label>
                      <div className="mt-2">
                        {aadhaarPreview ? (
                          <div className="relative">
                            <img 
                              src={aadhaarPreview} 
                              alt="Aadhaar Preview" 
                              className="w-full max-w-md h-48 object-contain rounded-lg border-2 border-border bg-muted"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  step2: { ...prev.step2, aadhaar: null }
                                }));
                                setAadhaarPreview(null);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Click to upload Aadhaar card</span>
                            <input
                              id="aadhaar"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange('aadhaar', e.target.files?.[0] || null)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select the categories where you can provide assistance. Choose all that apply.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {TASK_CATEGORIES.map((category) => (
                        <div
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.step3.expertise_categories.includes(category)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{category}</span>
                            {formData.step3.expertise_categories.includes(category) && (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selected: {formData.step3.expertise_categories.length} {formData.step3.expertise_categories.length === 1 ? 'category' : 'categories'}
                    </p>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-muted/50 p-6 rounded-lg max-h-96 overflow-y-auto">
                      <h3 className="text-lg font-semibold mb-4">Bondhu Terms & Conditions</h3>
                      <div className="space-y-4">
                        {BONDHU_TERMS.map((term, index) => (
                          <div key={index} className="space-y-2">
                            <h4 className="font-medium text-sm">
                              {index + 1}. {term.title}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {term.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <Checkbox
                        id="terms"
                        checked={formData.step4.terms_accepted}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          step4: { terms_accepted: checked as boolean }
                        }))}
                      />
                      <label htmlFor="terms" className="text-sm cursor-pointer">
                        I have read and agree to the Bondhu Terms & Conditions. I understand my responsibilities as a Bondhu helper and agree to comply with all platform policies.
                      </label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !formData.step4.terms_accepted}>
              {isSubmitting ? 'Submitting...' : 'Complete Registration'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

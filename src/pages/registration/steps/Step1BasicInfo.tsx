import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { BondhuRegistrationData } from '@/types/types';

interface Step1BasicInfoProps {
  data: BondhuRegistrationData['step1'];
  onChange: (data: Partial<BondhuRegistrationData['step1']>) => void;
}

export default function Step1BasicInfo({ data, onChange }: Step1BasicInfoProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Full Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Enter your full name"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="college">
          College/University <span className="text-destructive">*</span>
        </Label>
        <Input
          id="college"
          placeholder="Enter your college or university name"
          value={data.college}
          onChange={(e) => onChange({ college: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campus_location">
          Campus Location <span className="text-destructive">*</span>
        </Label>
        <Input
          id="campus_location"
          placeholder="Enter your campus location (e.g., Mumbai, Maharashtra)"
          value={data.campus_location}
          onChange={(e) => onChange({ campus_location: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="about">
          About Yourself <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="about"
          placeholder="Tell us about yourself, your interests, and why you want to become a Bondhu..."
          value={data.about}
          onChange={(e) => onChange({ about: e.target.value })}
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Minimum 50 characters ({data.about.length}/50)
        </p>
      </div>
    </div>
  );
}

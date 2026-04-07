import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BondhuRegistrationData } from '@/types/types';
import { formatFileSize } from '@/lib/imageUpload';
import { toast } from 'sonner';

interface Step2DocumentsProps {
  data: BondhuRegistrationData['step2'];
  onChange: (data: Partial<BondhuRegistrationData['step2']>) => void;
}

export default function Step2Documents({ data, onChange }: Step2DocumentsProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [collegeIdPreview, setCollegeIdPreview] = useState<string | null>(null);
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    onChange({ photo: file });

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCollegeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    onChange({ college_id: file });

    const reader = new FileReader();
    reader.onloadend = () => {
      setCollegeIdPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    onChange({ aadhaar: file });

    const reader = new FileReader();
    reader.onloadend = () => {
      setAadhaarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    onChange({ photo: null });
    setPhotoPreview(null);
  };

  const removeCollegeId = () => {
    onChange({ college_id: null });
    setCollegeIdPreview(null);
  };

  const removeAadhaar = () => {
    onChange({ aadhaar: null });
    setAadhaarPreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="p-4 bg-info/10 border-info/20">
        <p className="text-sm text-info-foreground">
          <strong>Note:</strong> Images will be automatically compressed to under 1MB if needed.
          Supported formats: JPEG, PNG, WEBP, GIF. Filenames must contain only English letters and numbers.
        </p>
      </Card>

      {/* Profile Photo Upload */}
      <div className="space-y-2">
        <Label htmlFor="photo">
          Profile Photo <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Upload a clear photo of yourself
        </p>

        {!photoPreview ? (
          <label
            htmlFor="photo"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ImageIcon className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 5MB)</p>
            </div>
            <input
              id="photo"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </label>
        ) : (
          <Card className="relative p-4">
            <div className="flex items-start gap-4">
              <img
                src={photoPreview}
                alt="Profile preview"
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="font-medium">{data.photo?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {data.photo && formatFileSize(data.photo.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removePhoto}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* College ID Upload */}
      <div className="space-y-2">
        <Label htmlFor="college_id">
          College ID Card <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Upload your college/university ID card
        </p>

        {!collegeIdPreview ? (
          <label
            htmlFor="college_id"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FileText className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 5MB)</p>
            </div>
            <input
              id="college_id"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleCollegeIdChange}
            />
          </label>
        ) : (
          <Card className="relative p-4">
            <div className="flex items-start gap-4">
              <img
                src={collegeIdPreview}
                alt="College ID preview"
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="font-medium">{data.college_id?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {data.college_id && formatFileSize(data.college_id.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeCollegeId}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Aadhaar Upload */}
      <div className="space-y-2">
        <Label htmlFor="aadhaar">
          Aadhaar Card <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Upload your Aadhaar card (front or back)
        </p>

        {!aadhaarPreview ? (
          <label
            htmlFor="aadhaar"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FileText className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 5MB)</p>
            </div>
            <input
              id="aadhaar"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAadhaarChange}
            />
          </label>
        ) : (
          <Card className="relative p-4">
            <div className="flex items-start gap-4">
              <img
                src={aadhaarPreview}
                alt="Aadhaar preview"
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="font-medium">{data.aadhaar?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {data.aadhaar && formatFileSize(data.aadhaar.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeAadhaar}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Privacy Notice */}
      <Card className="p-4 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          🔒 <strong>Privacy:</strong> Your documents are securely stored and will only be visible to you and administrators.
          They will not be shared with other users.
        </p>
      </Card>
    </div>
  );
}

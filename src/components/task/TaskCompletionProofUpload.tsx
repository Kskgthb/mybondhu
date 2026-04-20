/**
 * Task Completion Proof Upload Component
 * Uploads proof photos to Supabase Storage (no Firebase)
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, X, CheckCircle2, Image as ImageIcon, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { compressImageIteratively } from '@/utils/fileUpload';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TaskCompletionProofUploadProps {
  taskId: string;
  taskTitle: string;
  existingProofUrl?: string | null;
  onUploadComplete: (proofUrl: string) => void;
  onSkip?: () => void;
  allowReplace?: boolean;
}

export default function TaskCompletionProofUpload({
  taskId,
  taskTitle,
  existingProofUrl,
  onUploadComplete,
  onSkip,
  allowReplace = false,
}: TaskCompletionProofUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingProofUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      toast.info('Compressing image...');
      const { blob, compressed, originalSize, finalSize } = await compressImageIteratively(selectedFile);

      if (compressed) {
        const originalMB = (originalSize / (1024 * 1024)).toFixed(2);
        const finalMB = (finalSize / (1024 * 1024)).toFixed(2);
        toast.success(`Image compressed from ${originalMB}MB to ${finalMB}MB`);
      }

      setUploadProgress(30);

      const timestamp = Date.now();
      const fileName = `task_completion_${taskId}_${timestamp}.webp`;
      const path = `task_proofs/${fileName}`;

      const { data, error } = await supabase.storage
        .from('app-83dmv202aiv5_bondhu_documents')
        .upload(path, blob, { contentType: 'image/webp', upsert: false });

      if (error) throw new Error(error.message);

      setUploadProgress(90);

      const { data: urlData } = supabase.storage
        .from('app-83dmv202aiv5_bondhu_documents')
        .getPublicUrl(data.path);

      setUploadProgress(100);
      toast.success('Proof uploaded successfully!');
      setUploading(false);
      onUploadComplete(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('Failed to upload proof');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(existingProofUrl || null);
    setIsReplacing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReplace = () => {
    setIsReplacing(true);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteExisting = async () => {
    if (!existingProofUrl) return;
    try {
      // Extract storage path from public URL
      const url = new URL(existingProofUrl);
      const parts = url.pathname.split('/object/public/app-83dmv202aiv5_bondhu_documents/');
      if (parts[1]) {
        await supabase.storage
          .from('app-83dmv202aiv5_bondhu_documents')
          .remove([decodeURIComponent(parts[1])]);
      }
      setPreviewUrl(null);
      toast.success('Proof deleted');
    } catch (error) {
      console.error('Error deleting proof:', error);
      toast.error('Failed to delete proof');
    }
  };

  const hasExistingProof = existingProofUrl && !isReplacing;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Upload Completion Proof
        </CardTitle>
        <CardDescription>
          Upload a photo as proof that you completed: <strong>{taskTitle}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExistingProof ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-700">Proof already uploaded</span>
              <Badge variant="secondary">Submitted</Badge>
            </div>
            <div className="relative rounded-lg overflow-hidden border">
              <img src={existingProofUrl} alt="Proof" className="w-full max-h-64 object-cover" />
            </div>
            {allowReplace && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReplace} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" /> Replace
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete proof?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteExisting}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">Click to select a photo</p>
                  <p className="text-xs text-gray-400">JPEG, PNG, WebP up to 10MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {uploading && (
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500 text-center">{Math.round(uploadProgress)}% uploaded</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload Proof</>
                )}
              </Button>
              {onSkip && (
                <Button variant="outline" onClick={onSkip} disabled={uploading}>
                  Skip
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

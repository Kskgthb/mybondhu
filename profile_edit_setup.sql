-- Run this script in your Supabase SQL Editor to ensure the Profile Edit feature works smoothly

-- 1. Ensure the profiles table allows users to update their own profile
-- This is necessary for saving the new username, phone number, and avatar_url
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 2. Ensure users can upload profile pictures (avatars) to the storage bucket
-- The bucket is "app-83dmv202aiv5_bondhu_documents"
-- This policy allows users to insert (upload) files only into their own folder
DROP POLICY IF EXISTS "Users can upload their own documents and avatars" ON storage.objects;
CREATE POLICY "Users can upload their own documents and avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'app-83dmv202aiv5_bondhu_documents' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Ensure users can update (overwrite) their existing avatars
DROP POLICY IF EXISTS "Users can update their own documents and avatars" ON storage.objects;
CREATE POLICY "Users can update their own documents and avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'app-83dmv202aiv5_bondhu_documents' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Ensure avatars and documents are publicly readable (or readable by authenticated users)
-- This allows the app to display the profile picture to everyone
DROP POLICY IF EXISTS "Avatars and documents are publicly readable" ON storage.objects;
CREATE POLICY "Avatars and documents are publicly readable"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'app-83dmv202aiv5_bondhu_documents'
);

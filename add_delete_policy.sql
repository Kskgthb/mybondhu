CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

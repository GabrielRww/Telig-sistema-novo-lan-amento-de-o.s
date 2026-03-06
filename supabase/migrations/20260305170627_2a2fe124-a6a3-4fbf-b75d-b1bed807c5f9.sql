-- Fix audit_log INSERT policy to require user_id = auth.uid()
DROP POLICY IF EXISTS "System can insert audit log" ON public.audit_log;
CREATE POLICY "Users can insert own audit entries" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
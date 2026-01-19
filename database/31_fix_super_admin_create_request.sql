-- Fix RLS policy to allow Super Admin to create conversion requests directly
-- This enables Super Admin to bypass the approval workflow

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Salesperson can create requests" ON public.conversion_requests;

-- Create new policy that allows both Salesperson and Super Admin to insert
CREATE POLICY "Salesperson and Super Admin can create requests"
ON public.conversion_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('SALESPERSON', 'SUPER_ADMIN', 'OWNER_SUPER_ADMIN')
  )
);

COMMENT ON POLICY "Salesperson and Super Admin can create requests" ON public.conversion_requests 
IS 'Allows Salesperson to create requests for approval workflow, and Super Admin to create pre-approved requests for direct outlet creation';

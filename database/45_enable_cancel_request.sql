-- ============================================================
-- 45. ENABLE CANCEL REQUEST FEATURE
-- Date: 2026-01-19
-- Purpose: Allow salespersons to cancel their own pending requests
-- ============================================================

-- 1. Update Check Constraint to include 'cancelled'
-- Note: We drop the existing constraint and add a new one
DO $$
BEGIN
    -- Drop the constraint if it exists (handling default name)
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'conversion_requests_status_check'
    ) THEN
        ALTER TABLE public.conversion_requests DROP CONSTRAINT conversion_requests_status_check;
    END IF;

    -- Add the updated constraint
    ALTER TABLE public.conversion_requests 
    ADD CONSTRAINT conversion_requests_status_check 
    CHECK (status IN (
      'pending_manager_review',
      'query_from_manager',
      'manager_approved',
      'pending_admin_approval',
      'fully_approved',
      'rejected',
      'outlet_created',
      'cancelled' -- New status
    ));
END $$;

-- 2. Update Salesperson RLS Policy
-- Drop existing policy
DROP POLICY IF EXISTS "Salesperson can update own requests" ON public.conversion_requests;

-- Create new policy that allows cancelling pending requests
CREATE POLICY "Salesperson can update own requests"
ON public.conversion_requests
FOR UPDATE
USING (
  auth.uid() = salesperson_id
  AND (
    -- Can update if replying to query or if rejected (existing logic)
    status IN ('query_from_manager', 'rejected')
    OR
    -- Can update (cancel) if pending
    status = 'pending_manager_review'
  )
)
WITH CHECK (
  auth.uid() = salesperson_id
  AND (
    -- If replying/fixing, status remains same or changes to pending
    (status IN ('pending_manager_review') AND OLD.status IN ('query_from_manager', 'rejected'))
    OR
    -- If cancelling, new status must be 'cancelled'
    (status = 'cancelled' AND OLD.status = 'pending_manager_review')
  )
);

-- 3. Grant verify access
-- Ensure 'cancelled' is handled in metrics queries if necessary
-- (No schema changes needed for this, just application logic)

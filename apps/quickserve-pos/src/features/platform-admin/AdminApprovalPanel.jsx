import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { ConversionRequestService } from '@/services/ConversionRequestService';
import { OutletCreationService } from '@/services/OutletCreationService';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

const AdminApprovalPanel = ({ requestId, userId, onUpdate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [creationStatus, setCreationStatus] = useState(null);

  const handleApprove = async () => {
    setLoading(true);
    setCreationStatus('Approving request...');
    
    try {
      // Step 1: Approve the request
      const approveResult = await ConversionRequestService.adminApprove(requestId, userId);
      
      if (!approveResult.success) {
        throw new Error(approveResult.error || 'Failed to approve request');
      }

      setCreationStatus('Creating outlet and owner account...');

      // Step 2: Create outlet automatically
      const createResult = await OutletCreationService.createOutletFromRequest(requestId, userId);
      
      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create outlet');
      }

      setCreationStatus('Outlet created successfully!');

      // Step 3: Show success with credentials info
      if (createResult.data.credentials.emailSent) {
          toast({
            title: 'Success!',
            description: `Outlet created successfully. Credentials have been emailed to ${createResult.data.credentials.email}`
          });
      } else {
          toast({
            variant: 'destructive', // Or warning if possible, but 'destructive' grabs attention
            title: 'Outlet Created, but Email Failed',
            description: `Outlet created (ID: ${createResult.data.credentials.outletId}), but we failed to send the email to ${createResult.data.credentials.email}. Please notify the owner manually.`
          });
      }

      setApproveModalOpen(false);
      setCreationStatus(null);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error in approval/creation:', error);
      setCreationStatus(null);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide a rejection reason'
      });
      return;
    }

    setLoading(true);
    try {
      const result = await ConversionRequestService.adminReject(requestId, rejectionReason, userId);
      
      if (result.success) {
        toast({
          title: 'Request Rejected',
          description: 'Salesperson and Manager have been notified'
        });
        setRejectionReason('');
        setRejectModalOpen(false);
        if (onUpdate) onUpdate();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to reject request'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">Admin Final Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Final approval will automatically create the outlet and send credentials to the owner.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setApproveModalOpen(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4" />
              Final Approve & Create Outlet
            </Button>
            
            <Button
              onClick={() => setRejectModalOpen(true)}
              variant="destructive"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Final Approval & Outlet Creation</DialogTitle>
            <DialogDescription>
              This will create the outlet, owner account, and send credentials
            </DialogDescription>
          </DialogHeader>
          
          {creationStatus ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <p className="text-sm text-gray-600">{creationStatus}</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>This action will:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Create a new Supabase Auth user</li>
                    <li>Create user profile and restaurant owner</li>
                    <li>Create the restaurant (outlet)</li>
                    <li>Generate temporary credentials</li>
                    <li>Create subscription tracking</li>
                    <li>Send email with login details</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <p className="text-sm text-gray-600">
                Are you sure you want to proceed? This action cannot be undone.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setApproveModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm & Create Outlet'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRejectModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminApprovalPanel;

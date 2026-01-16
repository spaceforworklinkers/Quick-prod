import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ConversionRequestService } from '@/services/ConversionRequestService';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const ManagerReviewPanel = ({ requestId, requestStatus, userId, onUpdate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [queryMessage, setQueryMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const handleAddQuery = async () => {
    if (!queryMessage.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a query message'
      });
      return;
    }

    setLoading(true);
    try {
      const result = await ConversionRequestService.addManagerQuery(requestId, queryMessage, userId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Query sent to salesperson'
        });
        setQueryMessage('');
        setQueryModalOpen(false);
        if (onUpdate) onUpdate();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to send query'
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

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await ConversionRequestService.managerApprove(requestId, userId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Request approved and sent to Admin for final approval'
        });
        setApproveModalOpen(false);
        if (onUpdate) onUpdate();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to approve request'
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
      const result = await ConversionRequestService.managerReject(requestId, rejectionReason, userId);
      
      if (result.success) {
        toast({
          title: 'Request Rejected',
          description: 'Salesperson has been notified'
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
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900">Manager Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setQueryModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Add Query
            </Button>
            
            <Button
              onClick={() => setApproveModalOpen(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
            
            <Button
              onClick={() => setRejectModalOpen(true)}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Query Modal */}
      <Dialog open={queryModalOpen} onOpenChange={setQueryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Query</DialogTitle>
            <DialogDescription>
              Send a question or clarification request to the salesperson
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your query here..."
              value={queryMessage}
              onChange={(e) => setQueryMessage(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQueryModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddQuery} disabled={loading}>
              {loading ? 'Sending...' : 'Send Query'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              This will send the request to Admin/Super Admin for final approval
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to approve this conversion request? 
              The request will move to the next approval stage.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Approving...' : 'Confirm Approval'}
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
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
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

export default ManagerReviewPanel;

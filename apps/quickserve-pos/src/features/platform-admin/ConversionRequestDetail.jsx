import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConversionRequestService } from '@/services/ConversionRequestService';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Building2, User, Mail, Phone, Calendar, FileText, CheckCircle, XCircle, MessageSquare, Clock } from 'lucide-react';
import ManagerReviewPanel from './ManagerReviewPanel';
import AdminApprovalPanel from './AdminApprovalPanel';
import QueryThread from './QueryThread';

const statusConfig = {
  pending_manager_review: { label: 'Pending Manager Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  query_from_manager: { label: 'Query from Manager', color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
  manager_approved: { label: 'Manager Approved', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  fully_approved: { label: 'Fully Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  outlet_created: { label: 'Outlet Created', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
};

const ConversionRequestDetail = ({ userId, userRole }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    setLoading(true);
    const result = await ConversionRequestService.getRequestById(id);
    if (result.success) {
      setRequest(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load request details'
      });
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading request details...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-gray-500 mb-4">Request not found</div>
        <Button onClick={() => navigate('..')}>
          Back to List
        </Button>
      </div>
    );
  }

  const StatusIcon = statusConfig[request.status]?.icon || FileText;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('..')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{request.outlet_name}</h1>
            <p className="text-sm text-gray-500">Request #{request.request_number}</p>
          </div>
        </div>
        <Badge className={`${statusConfig[request.status].color} flex items-center gap-2 px-4 py-2`}>
          <StatusIcon className="h-4 w-4" />
          {statusConfig[request.status].label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Outlet Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-600" />
                Outlet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Outlet Name</p>
                  <p className="font-medium">{request.outlet_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Type</p>
                  <p className="font-medium">{request.business_type}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-600" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{request.owner_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </p>
                  <p className="font-medium">{request.owner_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </p>
                  <p className="font-medium">{request.owner_phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Intent</p>
                  <p className="font-medium capitalize">{request.subscription_intent}</p>
                </div>
                {request.subscription_intent === 'trial' ? (
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{request.trial_duration} Days</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium capitalize">{request.subscription_type}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          {request.internal_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Internal Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{request.internal_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {request.status === 'rejected' && request.rejection_reason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{request.rejection_reason}</p>
              </CardContent>
            </Card>
          )}

          {/* Query Thread */}
          {request.queries && request.queries.length > 0 && (
            <QueryThread
              queries={request.queries}
              requestId={request.id}
              requestStatus={request.status}
              userId={userId}
              userRole={userRole}
              onUpdate={fetchRequest}
            />
          )}

          {/* Action Panels */}
          {userRole === 'MANAGER' && ['pending_manager_review', 'query_from_manager'].includes(request.status) && (
            <ManagerReviewPanel
              requestId={request.id}
              requestStatus={request.status}
              userId={userId}
              onUpdate={fetchRequest}
            />
          )}

          {['ADMIN', 'SUPER_ADMIN'].includes(userRole) && request.status === 'manager_approved' && (
            <AdminApprovalPanel
              requestId={request.id}
              userId={userId}
              onUpdate={fetchRequest}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="w-0.5 h-full bg-gray-200"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm">Created</p>
                    <p className="text-xs text-gray-500">{formatDate(request.created_at)}</p>
                    {request.salesperson && (
                      <p className="text-xs text-gray-600 mt-1">by {request.salesperson.full_name}</p>
                    )}
                  </div>
                </div>

                {request.manager_reviewed_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <div className="w-0.5 h-full bg-gray-200"></div>
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-sm">Manager Review</p>
                      <p className="text-xs text-gray-500">{formatDate(request.manager_reviewed_at)}</p>
                      {request.manager && (
                        <p className="text-xs text-gray-600 mt-1">by {request.manager.full_name}</p>
                      )}
                    </div>
                  </div>
                )}

                {request.admin_approved_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div className="w-0.5 h-full bg-gray-200"></div>
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-sm">Admin Approval</p>
                      <p className="text-xs text-gray-500">{formatDate(request.admin_approved_at)}</p>
                      {request.approver && (
                        <p className="text-xs text-gray-600 mt-1">by {request.approver.full_name}</p>
                      )}
                    </div>
                  </div>
                )}

                {request.outlet_created_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Outlet Created</p>
                      <p className="text-xs text-gray-500">{formatDate(request.outlet_created_at)}</p>
                      {request.created_outlet && (
                        <p className="text-xs text-gray-600 mt-1">{request.created_outlet.name}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Request ID</span>
                <span className="font-mono text-xs">{request.id.slice(0, 8)}...</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium">{statusConfig[request.status].label}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span>{formatDate(request.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConversionRequestDetail;

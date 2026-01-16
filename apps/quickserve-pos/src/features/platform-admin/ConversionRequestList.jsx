import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConversionRequestService } from '@/services/ConversionRequestService';
import { Search, Eye, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusConfig = {
  pending_manager_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  query_from_manager: { label: 'Query', color: 'bg-blue-100 text-blue-800' },
  manager_approved: { label: 'Manager Approved', color: 'bg-purple-100 text-purple-800' },
  fully_approved: { label: 'Fully Approved', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  outlet_created: { label: 'Outlet Created', color: 'bg-emerald-100 text-emerald-800' }
};

const ConversionRequestList = ({ userId, userRole }) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchQuery, statusFilter, requests]);

  const fetchRequests = async () => {
    setLoading(true);
    const result = await ConversionRequestService.getRequests(userId, userRole);
    if (result.success) {
      setRequests(result.data);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const result = await ConversionRequestService.getStatistics();
    if (result.success) {
      setStats(result.data);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(req =>
        req.outlet_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.request_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_manager_review}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.query_from_manager}</div>
              <div className="text-sm text-gray-500">Queries</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{stats.manager_approved}</div>
              <div className="text-sm text-gray-500">Mgr Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.fully_approved}</div>
              <div className="text-sm text-gray-500">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-emerald-600">{stats.outlet_created}</div>
              <div className="text-sm text-gray-500">Created</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by outlet, owner, email, or request number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_manager_review">Pending Review</SelectItem>
                  <SelectItem value="query_from_manager">Query</SelectItem>
                  <SelectItem value="manager_approved">Manager Approved</SelectItem>
                  <SelectItem value="fully_approved">Fully Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="outlet_created">Outlet Created</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Request List */}
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No requests found
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(request.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{request.outlet_name}</h3>
                        <Badge className={statusConfig[request.status].color}>
                          {statusConfig[request.status].label}
                        </Badge>
                        <span className="text-sm text-gray-500">#{request.request_number}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Owner:</span> {request.owner_name}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {request.owner_email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {request.owner_phone}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mt-2">
                        <div>
                          <span className="font-medium">Type:</span> {request.business_type}
                        </div>
                        <div>
                          <span className="font-medium">Subscription:</span>{' '}
                          {request.subscription_intent === 'trial'
                            ? `Trial (${request.trial_duration} days)`
                            : `Paid ${request.subscription_type}`}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {formatDate(request.created_at)}
                        </div>
                      </div>

                      {request.salesperson && (
                        <div className="text-sm text-gray-500 mt-2">
                          <span className="font-medium">Salesperson:</span> {request.salesperson.full_name}
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionRequestList;

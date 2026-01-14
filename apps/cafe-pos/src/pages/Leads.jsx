import { useState } from 'react';
import { Card, Badge, Button, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/UIComponents';
import { mockLeads } from '../data/mockData';
import { Search, Filter, CheckCircle, XCircle, Phone, Calendar } from 'lucide-react';
import { MdOutlineLeaderboard, MdPersonAdd } from 'react-icons/md';
import { FaUserTie, FaPhoneAlt } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';

const Leads = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trialFilter, setTrialFilter] = useState('all');

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = lead.cafeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesTrial = trialFilter === 'all' || lead.trialType === trialFilter;
    return matchesSearch && matchesStatus && matchesTrial;
  });

  const stats = {
    total: mockLeads.length,
    pending: mockLeads.filter(l => l.status === 'pending').length,
    approved: mockLeads.filter(l => l.status === 'approved').length,
    rejected: mockLeads.filter(l => l.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MdOutlineLeaderboard className="w-7 h-7 text-orange-600" />
            Leads Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">Review and approve trial requests from potential cafes</p>
        </div>
        <Button className="mt-4 md:mt-0 flex items-center gap-2">
          <MdPersonAdd className="w-5 h-5" />
          Add New Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-600">Total Leads</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <p className="text-sm text-gray-600">Pending Review</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.approved}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.rejected}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by cafe or owner name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <Select
            label=""
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <Select
            label=""
            value={trialFilter}
            onChange={(e) => setTrialFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Trials' },
              { value: '15 days', label: '15 Days' },
              { value: '30 days', label: '30 Days' },
            ]}
          />
        </div>
      </Card>

      {/* Leads Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cafe Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Trial Type</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.cafeName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                        <FaUserTie className="w-4 h-4 text-white" />
                      </div>
                      {lead.ownerName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaPhoneAlt className="w-3 h-3" />
                      {lead.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BiTimeFive className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{lead.trialType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{lead.salesperson}</TableCell>
                  <TableCell>
                    <Badge variant={lead.status}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <MdOutlineLeaderboard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No leads found matching your filters</p>
        </div>
      )}
    </div>
  );
};

export default Leads;

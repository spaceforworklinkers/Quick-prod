import { useState } from 'react';
import { Card, Badge, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/UIComponents';
import { mockCafes } from '../data/mockData';
import { Search, Eye, MapPin, TrendingUp } from 'lucide-react';
import { FaStore, FaUserCircle } from 'react-icons/fa';
import { MdLocationOn, MdAttachMoney } from 'react-icons/md';
import { BiTimeFive } from 'react-icons/bi';

const Cafes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCafes = mockCafes.filter(cafe => {
    const matchesSearch = cafe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cafe.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cafe.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cafe.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockCafes.length,
    active: mockCafes.filter(c => c.status === 'active').length,
    trial: mockCafes.filter(c => c.status === 'trial').length,
    expired: mockCafes.filter(c => c.status === 'expired').length,
    suspended: mockCafes.filter(c => c.status === 'suspended').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaStore className="w-6 h-6 text-orange-600" />
            Cafes & Tenants
          </h1>
          <p className="text-sm text-gray-600 mt-1">Manage all registered cafes and their subscriptions</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Total Cafes</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-700 font-medium">Active</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{stats.active}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <p className="text-sm text-yellow-700 font-medium">On Trial</p>
          <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.trial}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <p className="text-sm text-red-700 font-medium">Expired</p>
          <p className="text-3xl font-bold text-red-900 mt-2">{stats.expired}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <p className="text-sm text-orange-700 font-medium">Suspended</p>
          <p className="text-3xl font-bold text-orange-900 mt-2">{stats.suspended}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by cafe name, owner, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'trial', 'expired', 'suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Cafes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCafes.map((cafe) => (
          <Card key={cafe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Card Header */}
            <div className={`h-2 ${
              cafe.status === 'active' ? 'bg-green-500' :
              cafe.status === 'trial' ? 'bg-blue-500' :
              cafe.status === 'expired' ? 'bg-red-500' :
              'bg-yellow-500'
            }`}></div>
            
            <div className="p-6">
              {/* Cafe Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{cafe.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaUserCircle className="w-4 h-4" />
                    {cafe.owner}
                  </div>
                </div>
                <Badge variant={cafe.status}>
                  {cafe.status.charAt(0).toUpperCase() + cafe.status.slice(1)}
                </Badge>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <MdLocationOn className="w-4 h-4 text-orange-600" />
                {cafe.location}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Subscription</p>
                  <p className="text-sm font-semibold text-gray-900">{cafe.subscription}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Revenue</p>
                  <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                    <MdAttachMoney className="w-4 h-4" />
                    {cafe.revenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Trial Days */}
              {cafe.status === 'trial' && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <BiTimeFive className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-900">
                      <span className="font-bold">{cafe.trialDaysLeft}</span> days remaining
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCafes.length === 0 && (
        <div className="text-center py-12">
          <FaStore className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No cafes found matching your filters</p>
        </div>
      )}

      {/* Table View (Alternative) */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detailed View</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cafe Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Trial Days</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCafes.map((cafe) => (
                <TableRow key={cafe.id}>
                  <TableCell className="font-medium">{cafe.name}</TableCell>
                  <TableCell>{cafe.owner}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MdLocationOn className="w-4 h-4 text-gray-400" />
                      {cafe.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={cafe.status}>
                      {cafe.status.charAt(0).toUpperCase() + cafe.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{cafe.subscription}</TableCell>
                  <TableCell>
                    {cafe.status === 'trial' ? (
                      <span className={`font-medium ${cafe.trialDaysLeft <= 7 ? 'text-red-600' : 'text-blue-600'}`}>
                        {cafe.trialDaysLeft} days
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    ₹{cafe.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <button className="text-orange-600 hover:text-orange-700 flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">View</span>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Cafes;

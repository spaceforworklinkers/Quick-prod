import { useState } from 'react';
import { Card, Badge, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/UIComponents';
import { mockPlatformUsers } from '../data/mockData';
import { Search, UserPlus, Mail, Shield } from 'lucide-react';
import { FaUserShield, FaUserTie, FaUserCog } from 'react-icons/fa';
import { MdAdminPanelSettings, MdManageAccounts } from 'react-icons/md';
import { RiUserSettingsLine } from 'react-icons/ri';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = mockPlatformUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleStats = {
    total: mockPlatformUsers.length,
    superAdmin: mockPlatformUsers.filter(u => u.role === 'Super Admin').length,
    admin: mockPlatformUsers.filter(u => u.role === 'Admin').length,
    manager: mockPlatformUsers.filter(u => u.role === 'Manager').length,
    salesperson: mockPlatformUsers.filter(u => u.role === 'Salesperson').length,
    accountant: mockPlatformUsers.filter(u => u.role === 'Accountant').length,
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'Super Admin': return FaUserShield;
      case 'Admin': return MdAdminPanelSettings;
      case 'Manager': return MdManageAccounts;
      case 'Salesperson': return FaUserTie;
      case 'Accountant': return RiUserSettingsLine;
      default: return FaUserCog;
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'Super Admin': return 'from-purple-500 to-purple-600';
      case 'Admin': return 'from-blue-500 to-blue-600';
      case 'Manager': return 'from-green-500 to-green-600';
      case 'Salesperson': return 'from-orange-500 to-orange-600';
      case 'Accountant': return 'from-emerald-500 to-emerald-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaUserShield className="w-6 h-6 text-orange-600" />
            Platform Users & Roles
          </h1>
          <p className="text-sm text-gray-600 mt-1">Manage platform administrators and their permissions</p>
        </div>
        <Button className="mt-4 md:mt-0 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Invite User
        </Button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 border-l-4 border-l-gray-500">
          <p className="text-xs text-gray-600 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{roleStats.total}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-500">
          <p className="text-xs text-gray-600 mb-1">Super Admins</p>
          <p className="text-2xl font-bold text-gray-900">{roleStats.superAdmin}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-600 mb-1">Admins</p>
          <p className="text-2xl font-bold text-gray-900">{roleStats.admin}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-600 mb-1">Managers</p>
          <p className="text-2xl font-bold text-gray-900">{roleStats.manager}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-orange-500">
          <p className="text-xs text-gray-600 mb-1">Salespersons</p>
          <p className="text-2xl font-bold text-gray-900">{roleStats.salesperson}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs text-gray-600 mb-1">Accountants</p>
          <p className="text-2xl font-bold text-gray-900">{roleStats.accountant}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'Super Admin', 'Admin', 'Manager', 'Salesperson', 'Accountant'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  roleFilter === role
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role === 'all' ? 'All Roles' : role}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          const RoleIcon = getRoleIcon(user.role);
          return (
            <Card key={user.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* User Avatar & Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${getRoleColor(user.role)} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <RoleIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{user.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="mb-4">
                  <Badge variant="default" className="w-full justify-center py-2">
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role}
                  </Badge>
                </div>

                {/* Status & Last Login */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <Badge variant={user.status === 'active' ? 'active' : 'suspended'}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Login</p>
                    <p className="text-sm font-medium text-gray-900">{user.lastLogin}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                  <Button variant="secondary" size="sm" className="flex-1">Permissions</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Table View */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detailed View</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getRoleColor(user.role)} rounded-full flex items-center justify-center`}>
                          <RoleIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="default">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'active' : 'suspended'}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{user.lastLogin}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Role Permissions Info */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Role Permissions Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Super Admin</h4>
            <p className="text-sm text-gray-600">Full platform access including revenue visibility</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Admin</h4>
            <p className="text-sm text-gray-600">Technical management, no financial data</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Manager</h4>
            <p className="text-sm text-gray-600">Lead approval and cafe management</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-2">Salesperson</h4>
            <p className="text-sm text-gray-600">Lead creation and customer interaction</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-2">Accountant</h4>
            <p className="text-sm text-gray-600">Financial data and revenue reports only</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Users;

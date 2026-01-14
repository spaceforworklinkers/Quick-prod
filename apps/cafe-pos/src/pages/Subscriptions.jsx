import { Card, Badge, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/UIComponents';
import { mockSubscriptions, mockCafes } from '../data/mockData';
import { CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { MdAttachMoney, MdTrendingUp } from 'react-icons/md';
import { FaFileInvoiceDollar, FaCreditCard } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';

const Subscriptions = () => {
  const stats = {
    active: mockSubscriptions.filter(s => s.status === 'active').length,
    trial: mockSubscriptions.filter(s => s.status === 'trial').length,
    expired: mockSubscriptions.filter(s => s.status === 'expired').length,
    totalRevenue: mockSubscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.amount, 0),
    expiringSoon: mockSubscriptions.filter(s => {
      const daysUntil = Math.floor((new Date(s.nextBilling) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && s.status === 'active';
    }).length,
  };

  // Simple chart for subscription distribution
  const SubscriptionChart = () => {
    const plans = {
      Premium: mockSubscriptions.filter(s => s.plan === 'Premium').length,
      Basic: mockSubscriptions.filter(s => s.plan === 'Basic').length,
      Trial: mockSubscriptions.filter(s => s.plan === 'Trial').length,
    };
    const total = Object.values(plans).reduce((a, b) => a + b, 0);

    return (
      <div className="space-y-3">
        {Object.entries(plans).map(([plan, count]) => (
          <div key={plan}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{plan}</span>
              <span className="text-sm text-gray-600">{count} cafes</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  plan === 'Premium' ? 'bg-purple-600' :
                  plan === 'Basic' ? 'bg-blue-600' :
                  'bg-yellow-600'
                }`}
                style={{ width: `${(count / total) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FaCreditCard className="w-6 h-6 text-orange-600" />
          Subscriptions & Billing
        </h1>
        <p className="text-sm text-gray-600 mt-1">Monitor subscription status and billing information</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Subscriptions</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.active}</h3>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Trial Subscriptions</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.trial}</h3>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
              <BiTimeFive className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</h3>
              <p className="text-sm text-green-600 mt-1">↑ +12% from last month</p>
            </div>
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg">
              <MdAttachMoney className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expiring Soon</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.expiringSoon}</h3>
              <p className="text-xs text-gray-500 mt-1">Within 7 days</p>
            </div>
            <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h2>
          <SubscriptionChart />
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-700 mb-1">Premium Plans</p>
              <p className="text-2xl font-bold text-purple-900">
                ₹{(mockSubscriptions.filter(s => s.plan === 'Premium' && s.status === 'active')
                  .reduce((sum, s) => sum + s.amount, 0)).toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-700 mb-1">Basic Plans</p>
              <p className="text-2xl font-bold text-blue-900">
                ₹{(mockSubscriptions.filter(s => s.plan === 'Basic' && s.status === 'active')
                  .reduce((sum, s) => sum + s.amount, 0)).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700 mb-1">Trials</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockSubscriptions.filter(s => s.plan === 'Trial').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Subscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cafe Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSubscriptions.map((sub) => {
                const daysUntil = Math.floor((new Date(sub.nextBilling) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.cafeName}</TableCell>
                    <TableCell>
                      <Badge variant={
                        sub.plan === 'Premium' ? 'default' :
                        sub.plan === 'Basic' ? 'trial' :
                        'pending'
                      }>
                        {sub.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">₹{sub.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={sub.status}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={daysUntil <= 7 && sub.status === 'active' ? 'text-orange-600 font-medium' : ''}>
                          {sub.nextBilling}
                        </span>
                        {daysUntil <= 7 && sub.status === 'active' && (
                          <span className="text-xs text-orange-600">({daysUntil}d)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.paymentStatus === 'paid' ? 'paid' : sub.paymentStatus === 'pending' ? 'pending' : 'overdue'}>
                        {sub.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Expiring Soon Alert */}
      {stats.expiringSoon > 0 && (
        <Card className="p-6 bg-orange-50 border-orange-200">
          <div className="flex items-start gap-4">
            <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Subscriptions Expiring Soon</h3>
              <p className="text-sm text-gray-700 mb-3">
                {stats.expiringSoon} subscription{stats.expiringSoon > 1 ? 's' : ''} will expire within the next 7 days. 
                Consider reaching out to these cafes for renewal.
              </p>
              <Button size="sm">View Details</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Subscriptions;

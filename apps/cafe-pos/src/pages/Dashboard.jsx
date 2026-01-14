import { Card, StatCard, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/UIComponents';
import { mockDashboardStats, mockRecentActivity, mockRevenueData, mockCafes } from '../data/mockData';
import { TrendingUp, Users, Store, AlertCircle, DollarSign, Activity } from 'lucide-react';
import { FaStore, FaChartLine, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { MdTrendingUp, MdAttachMoney } from 'react-icons/md';
import { RiLineChartLine } from 'react-icons/ri';

const Dashboard = () => {
  const stats = mockDashboardStats;

  // Simple bar chart component
  const RevenueChart = () => (
    <div className="flex items-end justify-between h-48 px-4">
      {mockRevenueData.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div className="w-full mx-1 bg-orange-200 rounded-t-lg relative group cursor-pointer hover:bg-orange-300 transition-colors">
            <div 
              className="bg-gradient-to-t from-orange-600 to-orange-500 rounded-t-lg transition-all duration-300"
              style={{ height: `${(item.revenue / 300000) * 100}%` }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ₹{(item.revenue / 1000).toFixed(0)}k
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-600 mt-2">{item.month}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FaStore}
          label="Total Cafes"
          value={stats.totalCafes}
          trend="up"
          trendValue="+2 this week"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={FaCheckCircle}
          label="Active Cafes"
          value={stats.activeCafes}
          trend="up"
          trendValue="+1 this week"
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={Activity}
          label="Trial Cafes"
          value={stats.trialCafes}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatCard
          icon={FaExclamationTriangle}
          label="Expired Cafes"
          value={stats.expiredCafes}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Revenue & Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard
          icon={MdAttachMoney}
          label="Monthly Revenue"
          value={`₹${(stats.monthlyRevenue / 1000).toFixed(0)}k`}
          trend="up"
          trendValue="+12% from last month"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={MdTrendingUp}
          label="Trial Conversion"
          value={`${stats.trialConversionRate}%`}
          trend="up"
          trendValue="+5% from last month"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={AlertCircle}
          label="Expiring Soon"
          value={stats.upcomingExpiries}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Revenue Chart & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
              <p className="text-sm text-gray-600">Last 7 months performance</p>
            </div>
            <RiLineChartLine className="w-6 h-6 text-orange-600" />
          </div>
          <RevenueChart />
        </Card>

        {/* System Health */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#10b981"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - stats.systemHealth / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{stats.systemHealth}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">All systems operational</p>
            <div className="w-full mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">API Response</span>
                <span className="text-green-600 font-medium">99.9%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Database</span>
                <span className="text-green-600 font-medium">100%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uptime</span>
                <span className="text-green-600 font-medium">99.8%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity & Upcoming Expiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'cafe_activated' ? 'bg-green-500' :
                  activity.type === 'trial_started' ? 'bg-blue-500' :
                  activity.type === 'payment_received' ? 'bg-emerald-500' :
                  activity.type === 'lead_approved' ? 'bg-purple-500' :
                  'bg-red-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Trial Expiries */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Trial Expiries</h2>
          <div className="space-y-3">
            {mockCafes.filter(cafe => cafe.status === 'trial' && cafe.trialDaysLeft <= 7).map((cafe) => (
              <div key={cafe.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{cafe.name}</p>
                  <p className="text-xs text-gray-600">{cafe.owner}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-orange-600">{cafe.trialDaysLeft} days</p>
                  <p className="text-xs text-gray-500">remaining</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Performing Cafes */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Cafes</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cafe Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCafes
              .filter(cafe => cafe.status === 'active')
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 5)
              .map((cafe) => (
                <TableRow key={cafe.id}>
                  <TableCell className="font-medium">{cafe.name}</TableCell>
                  <TableCell>{cafe.owner}</TableCell>
                  <TableCell>{cafe.location}</TableCell>
                  <TableCell>
                    <Badge variant={cafe.status}>{cafe.subscription}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">₹{cafe.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Dashboard;

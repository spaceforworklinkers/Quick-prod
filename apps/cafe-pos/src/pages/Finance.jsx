import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/UIComponents';
import { mockInvoices, mockRevenueData, mockSubscriptions } from '../data/mockData';
import { DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import { MdAttachMoney, MdAccountBalance } from 'react-icons/md';
import { FaFileInvoiceDollar, FaChartLine } from 'react-icons/fa';
import { RiMoneyDollarCircleLine } from 'react-icons/ri';

const Finance = () => {
  const totalRevenue = mockSubscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);
  
  const totalTax = mockInvoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.tax, 0);

  const pendingPayments = mockInvoices
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  const paidInvoices = mockInvoices.filter(i => i.status === 'paid').length;

  // Revenue trend chart
  const RevenueChart = () => (
    <div className="flex items-end justify-between h-64 px-4">
      {mockRevenueData.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div className="w-full mx-1 relative group cursor-pointer">
            <div 
              className="bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-300 hover:from-emerald-700 hover:to-emerald-500"
              style={{ height: `${(item.revenue / 300000) * 100}%` }}
            >
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                <div className="font-semibold">₹{(item.revenue / 1000).toFixed(0)}k</div>
                <div className="text-gray-300">{item.month} 2026</div>
              </div>
            </div>
          </div>
          <span className="text-sm font-medium text-gray-700 mt-3">{item.month}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MdAccountBalance className="w-7 h-7 text-orange-600" />
          Finance & Accounting
        </h1>
        <p className="text-sm text-gray-600 mt-1">Revenue tracking, invoices, and financial reports</p>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-medium mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-emerald-900">₹{totalRevenue.toLocaleString()}</h3>
              <p className="text-sm text-emerald-600 mt-2">↑ +12% from last month</p>
            </div>
            <div className="bg-emerald-200 text-emerald-700 p-3 rounded-lg">
              <MdAttachMoney className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Tax Collected</p>
              <h3 className="text-3xl font-bold text-blue-900">₹{totalTax.toFixed(2)}</h3>
              <p className="text-xs text-blue-600 mt-2">GST 18%</p>
            </div>
            <div className="bg-blue-200 text-blue-700 p-3 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium mb-1">Pending Payments</p>
              <h3 className="text-3xl font-bold text-orange-900">₹{pendingPayments.toLocaleString()}</h3>
              <p className="text-xs text-orange-600 mt-2">{mockInvoices.filter(i => i.status !== 'paid').length} invoices</p>
            </div>
            <div className="bg-orange-200 text-orange-700 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">Paid Invoices</p>
              <h3 className="text-3xl font-bold text-purple-900">{paidInvoices}</h3>
              <p className="text-xs text-purple-600 mt-2">This month</p>
            </div>
            <div className="bg-purple-200 text-purple-700 p-3 rounded-lg">
              <FaFileInvoiceDollar className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
            <p className="text-sm text-gray-600">Monthly recurring revenue over time</p>
          </div>
          <FaChartLine className="w-6 h-6 text-emerald-600" />
        </div>
        <RevenueChart />
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h2>
          <div className="space-y-4">
            {[
              { plan: 'Premium', amount: mockSubscriptions.filter(s => s.plan === 'Premium' && s.status === 'active').reduce((sum, s) => sum + s.amount, 0), color: 'purple' },
              { plan: 'Basic', amount: mockSubscriptions.filter(s => s.plan === 'Basic' && s.status === 'active').reduce((sum, s) => sum + s.amount, 0), color: 'blue' },
            ].map((item) => (
              <div key={item.plan}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.plan}</span>
                  <span className="text-sm font-bold text-gray-900">₹{item.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full bg-${item.color}-600`}
                    style={{ 
                      width: `${(item.amount / totalRevenue) * 100}%`,
                      background: item.color === 'purple' ? '#9333ea' : '#2563eb'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Tax Collected</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalTax.toFixed(2)}</p>
              </div>
              <RiMoneyDollarCircleLine className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 mb-1">CGST (9%)</p>
                <p className="text-lg font-bold text-blue-900">₹{(totalTax / 2).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 mb-1">SGST (9%)</p>
                <p className="text-lg font-bold text-blue-900">₹{(totalTax / 2).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Cafe Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Tax (18%)</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.cafeName}</TableCell>
                  <TableCell className="text-gray-600">{invoice.date}</TableCell>
                  <TableCell className="font-semibold">₹{invoice.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-600">₹{invoice.tax.toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-gray-900">₹{(invoice.amount + invoice.tax).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                      Download
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Financial Notes */}
      <Card className="p-6 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-4">
          <div className="bg-amber-100 text-amber-700 p-3 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Accountant Access</h3>
            <p className="text-sm text-gray-700">
              This view is accessible to <strong>Owner Super Admin</strong> and <strong>Accountant</strong> roles only. 
              All financial data is strictly confidential and isolated from operational platform users.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Finance;

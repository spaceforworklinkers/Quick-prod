import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  CreditCard, 
  UserCog, 
  DollarSign, 
  Settings, 
  Bell,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { FaUserTie, FaChartLine } from 'react-icons/fa';
import { MdOutlineLeaderboard } from 'react-icons/md';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/leads', icon: MdOutlineLeaderboard, label: 'Leads' },
    { path: '/cafes', icon: Store, label: 'Cafes' },
    { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { path: '/users', icon: Users, label: 'Platform Users' },
    { path: '/finance', icon: DollarSign, label: 'Finance' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <FaChartLine className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">QuickServe POS</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">Need Help?</p>
            <p className="text-xs text-gray-600 mb-3">Contact support team</p>
            <button className="w-full bg-orange-600 text-white text-sm py-2 rounded-lg hover:bg-orange-700 transition-colors">
              Get Support
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ setIsSidebarOpen }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-0 lg:left-64 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Platform Admin</h1>
            <p className="text-xs text-gray-500">Manage your SaaS operations</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm text-gray-900">New trial request from Cafe {i}</p>
                      <p className="text-xs text-gray-500 mt-1">{i} hours ago</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <FaUserTie className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</a>
                <hr className="my-2" />
                <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Logout</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <Header setIsSidebarOpen={setIsSidebarOpen} />
      <main className="lg:ml-64 pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

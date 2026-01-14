import { useState } from 'react';
import { Card, Input, Button, Badge } from '../components/ui/UIComponents';
import { Settings as SettingsIcon, Save, Building2, Clock, Flag, Bell } from 'lucide-react';
import { MdSettings, MdNotifications } from 'react-icons/md';
import { FaCog, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { RiSettings3Fill } from 'react-icons/ri';

const Settings = () => {
  const [companyName, setCompanyName] = useState('QuickServe POS');
  const [companyEmail, setCompanyEmail] = useState('admin@quickservepos.com');
  const [supportEmail, setSupportEmail] = useState('support@quickservepos.com');
  
  const [trialDuration15, setTrialDuration15] = useState(true);
  const [trialDuration30, setTrialDuration30] = useState(true);
  
  const [featureFlags, setFeatureFlags] = useState({
    offlineMode: true,
    kitchenDisplay: true,
    qrOrdering: true,
    inventoryManagement: false,
    advancedReports: true,
    multiLocation: false,
  });

  const toggleFeature = (feature) => {
    setFeatureFlags(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RiSettings3Fill className="w-7 h-7 text-orange-600" />
          Platform Settings
        </h1>
        <p className="text-sm text-gray-600 mt-1">Configure platform-level settings and preferences</p>
      </div>

      {/* Company Profile */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Company Profile</h2>
            <p className="text-sm text-gray-600">Update your company information</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter company name"
          />
          <Input
            label="Company Email"
            type="email"
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
            placeholder="admin@company.com"
          />
          <Input
            label="Support Email"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="support@company.com"
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 98765 43210"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Trial Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Trial Duration Configuration</h2>
            <p className="text-sm text-gray-600">Enable or disable trial period options</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">15-Day Trial</h3>
              <p className="text-sm text-gray-600">Allow cafes to start with 15-day trial period</p>
            </div>
            <button
              onClick={() => setTrialDuration15(!trialDuration15)}
              className="focus:outline-none"
            >
              {trialDuration15 ? (
                <FaToggleOn className="w-12 h-12 text-green-600" />
              ) : (
                <FaToggleOff className="w-12 h-12 text-gray-400" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">30-Day Trial</h3>
              <p className="text-sm text-gray-600">Allow cafes to start with 30-day trial period</p>
            </div>
            <button
              onClick={() => setTrialDuration30(!trialDuration30)}
              className="focus:outline-none"
            >
              {trialDuration30 ? (
                <FaToggleOn className="w-12 h-12 text-green-600" />
              ) : (
                <FaToggleOff className="w-12 h-12 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Subscription Plans */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
            <FaCog className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Subscription Plans</h2>
            <p className="text-sm text-gray-600">Configure pricing and features for each plan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Plan */}
          <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-900">Basic Plan</h3>
              <Badge variant="trial">Active</Badge>
            </div>
            <div className="mb-4">
              <Input
                label="Monthly Price (₹)"
                type="number"
                placeholder="1499"
              />
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p>✓ Single location</p>
              <p>✓ Basic POS features</p>
              <p>✓ Up to 50 menu items</p>
              <p>✓ Email support</p>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-purple-900">Premium Plan</h3>
              <Badge variant="active">Active</Badge>
            </div>
            <div className="mb-4">
              <Input
                label="Monthly Price (₹)"
                type="number"
                placeholder="2999"
              />
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p>✓ Multi-location support</p>
              <p>✓ Advanced POS features</p>
              <p>✓ Unlimited menu items</p>
              <p>✓ Priority support</p>
              <p>✓ Advanced analytics</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Update Plans
          </Button>
        </div>
      </Card>

      {/* Feature Flags */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-100 text-green-600 p-3 rounded-lg">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Feature Flags</h2>
            <p className="text-sm text-gray-600">Enable or disable features across all tenants</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(featureFlags).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <p className="text-xs text-gray-600">
                  {value ? 'Currently enabled' : 'Currently disabled'}
                </p>
              </div>
              <button
                onClick={() => toggleFeature(key)}
                className="focus:outline-none"
              >
                {value ? (
                  <FaToggleOn className="w-12 h-12 text-green-600" />
                ) : (
                  <FaToggleOff className="w-12 h-12 text-gray-400" />
                )}
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
            <MdNotifications className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
            <p className="text-sm text-gray-600">Configure email notifications for platform events</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: 'New Lead Created', desc: 'Notify when a new trial request is submitted' },
            { label: 'Trial Expiring Soon', desc: 'Alert 7 days before trial expiration' },
            { label: 'Payment Received', desc: 'Confirmation when subscription payment is received' },
            { label: 'Subscription Expired', desc: 'Notify when a cafe subscription expires' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">{item.label}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
              <button className="focus:outline-none">
                <FaToggleOn className="w-12 h-12 text-green-600" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Save All Button */}
      <div className="flex justify-end">
        <Button size="lg" className="flex items-center gap-2">
          <Save className="w-5 h-5" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;

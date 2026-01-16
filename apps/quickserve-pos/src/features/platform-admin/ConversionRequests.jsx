import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ConversionRequestForm from './ConversionRequestForm';
import ConversionRequestList from './ConversionRequestList';

export const ConversionRequests = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [showForm, setShowForm] = useState(false);

  const canCreateRequest = role === 'SALESPERSON';

  const handleRequestCreated = () => {
    setShowForm(false);
    setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversion Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage outlet creation requests with multi-level approval
          </p>
        </div>
        
        {canCreateRequest && !showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        )}
      </div>

      {showForm ? (
        <div>
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              ← Back to List
            </Button>
          </div>
          <ConversionRequestForm
            userId={user?.id}
            onSuccess={handleRequestCreated}
          />
        </div>
      ) : (
        <ConversionRequestList
          userId={user?.id}
          userRole={role}
        />
      )}
    </div>
  );
};

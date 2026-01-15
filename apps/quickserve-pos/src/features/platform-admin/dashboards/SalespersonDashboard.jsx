import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  FileText, 
  UserPlus,
  Clock, 
  RefreshCw, 
  Loader2,
  Trophy,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * SALESPERSON Dashboard
 * 
 * Focus: Lead generation & Personal tracking
 */
export const SalespersonDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myLeads: 0,
    trialLeads: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch only leads created by this salesperson
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id);
      
      setStats({ myLeads: count || 0, trialLeads: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sales Dashboard</h1>
          <p className="text-sm text-gray-500">Track your leads and progress</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white" size="sm">
          <UserPlus className="w-4 h-4 mr-1.5" />
          Add Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Total Leads</span>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats.myLeads}</p>
          <p className="text-xs text-gray-500 mt-2">Leads submitted by you</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Current Progress</span>
            <Trophy className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-4xl font-bold text-gray-900">0%</p>
          <p className="text-xs text-gray-500 mt-2">Conversion to subscribers</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-semibold text-sm">Action Items</div>
        <div className="p-8 text-center">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">No recent activity</p>
          <p className="text-xs text-gray-400 mt-1">Submit a new lead to start tracking</p>
        </div>
      </div>
    </div>
  );
};

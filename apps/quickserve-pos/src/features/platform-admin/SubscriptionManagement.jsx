import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SubscriptionService } from '@/services/SubscriptionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCcw, Search, Filter } from 'lucide-react';
import SubscriptionStats from './SubscriptionStats';
import SubscriptionList from './SubscriptionList';
import ExtendSubscriptionModal from './ExtendSubscriptionModal';
import PaymentProofDialog from './PaymentProofDialog';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, PLATFORM_PERMISSIONS } from '@/config/permissions';

export const SubscriptionManagement = () => {
    const { role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState([]);
    const [stats, setStats] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, expiring, expired
    
    // Modal states
    const [selectedSub, setSelectedSub] = useState(null);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [showProofModal, setShowProofModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setLoading(true);
        // Fetch stats
        const statsRes = await SubscriptionService.getStatistics();
        if (statsRes.success) setStats(statsRes.data);

        // Fetch List
        const listRes = await SubscriptionService.getAllSubscriptions({
            status: filter === 'all' ? null : filter
        });
        if (listRes.success) setSubscriptions(listRes.data);
        
        setLoading(false);
    };

    const handleViewDetails = (sub) => {
         setSelectedSub(sub);
         setShowProofModal(true);
    };

    const handleExtend = (sub) => {
        setSelectedSub(sub);
        setShowExtendModal(true);
    };

    const handleRefresh = () => {
        loadData();
    };

    const handleSystemCheck = async () => {
        setLoading(true);
        try {
            // Updated to use Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('check-subscriptions');
            
            if (error) throw error;
            
            if (data.success) {
                alert(`System Check Complete. Processed: ${data.processed || 0} subscriptions.`);
                loadData();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            alert("Check Failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor billing cycles, revenue, and subscription health.</p>
                </div>
                <div className="flex gap-2">
                    {hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_SYSTEM_SETTINGS) && (
                        <Button variant="outline" size="sm" onClick={handleSystemCheck}>
                            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Run System Check
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Statistics Overview */}
            <SubscriptionStats stats={stats} />

            {/* Filters & Actions */}
            <div className="flex gap-2 pb-2">
                {['all', 'active', 'expiring_soon', 'expired'].map(f => (
                    <Button 
                        key={f}
                        variant={filter === f ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(f)}
                        className="capitalize text-xs"
                    >
                        {f.replace('_', ' ')}
                    </Button>
                ))}
            </div>

            {/* Main List */}
            <SubscriptionList 
                subscriptions={subscriptions} 
                onViewDetails={handleViewDetails}
                onExtend={hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_SUBSCRIPTIONS) ? handleExtend : undefined}
            />

            {/* Modals */}
            {selectedSub && (
                <>
                    <ExtendSubscriptionModal 
                        isOpen={showExtendModal}
                        onClose={() => setShowExtendModal(false)}
                        subscription={selectedSub}
                        onSuccess={loadData}
                    />
                    <PaymentProofDialog
                        isOpen={showProofModal}
                        onClose={() => setShowProofModal(false)}
                        subscription={selectedSub}
                        onSuccess={loadData}
                    />
                </>
            )}
        </div>
    );
};

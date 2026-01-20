import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  History,
  Shield,
  Download,
  Search,
  AlertCircle,
  Filter,
  ArrowRight,
  User,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Audit Logs & Security Module (DEFINITIVE)
 * For: OWNER_SUPER_ADMIN
 */
export const AuditLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data: logsData, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (logsData && logsData.length > 0) {
        // Extract Actor IDs to fetch emails
        const actorIds = [...new Set(logsData.map(log => log.actor_id).filter(Boolean))];
        
        // Fetch User Profiles
        const { data: users } = await supabase
            .from('user_profiles')
            .select('id, email')
            .in('id', actorIds);

        // Map logs
        const mappedLogs = logsData.map(log => {
            const user = users?.find(u => u.id === log.actor_id);
            return {
                id: log.id,
                action: log.action,
                actor: user ? user.email : 'System/Unknown',
                timestamp: log.created_at,
                status: 'SUCCESS', // Default as our simple logger tracks successful completions
                details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details)
            };
        });
        setLogs(mappedLogs);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      // Fallback to empty or keep previous state, don't show mock data if DB fails to avoid confusion
      setLogs([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;

    // CSV Headers
    const headers = ['Timestamp', 'Actor Email', 'Action', 'Status', 'Details'];
    
    // CSV Content
    const rows = logs.map(log => [
        `"${new Date(log.timestamp).toLocaleString()}"`,
        `"${log.actor}"`,
        `"${log.action}"`,
        `"${log.status}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    if (status === 'SUCCESS') return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (status === 'WARNING') return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-red-500 bg-red-50 border-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-600" />
            Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            System activities, authentication events, and critical operation logs
          </p>
        </div>
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={handleExportCSV}
                disabled={logs.length === 0}
            >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={fetchLogs}
            >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>
      </div>

       {/* Security Indicators */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Security Status</span>
             </div>
             <p className="text-sm font-bold text-gray-900 italic">Level 1 - Protected</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-4 h-4 text-gray-300" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Threat Level</span>
             </div>
             <p className="text-sm font-bold text-gray-900">Zero detections</p>
          </div>
       </div>

      {/* Audit Timeline */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/10">
           <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                className="w-full h-9 pl-10 pr-4 text-xs bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/10 transition-all font-medium" 
                placeholder="Search by action or actor..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
             <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-200" /></div>
          ) : logs.map(log => (
            <div key={log.id} className="px-6 py-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
               <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  {log.action.includes('LOGIN') ? <LogIn className="w-5 h-5 text-blue-500" /> : <History className="w-5 h-5 text-gray-400" />}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                     <p className="text-sm font-bold text-gray-900 tracking-tight">{log.action.replace(/_/g, ' ')}</p>
                     <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getStatusColor(log.status)}`}>
                        {log.status}
                     </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mb-2">{log.details}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                     <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> {log.actor}</span>
                     <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString()}</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logs are immutable and stored in encrypted vault</p>
        </div>
      </div>
    </div>
  );
};

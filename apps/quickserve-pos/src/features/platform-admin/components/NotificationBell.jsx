import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Loader2, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { NotificationService } from '@/services/NotificationService';
import { useAuth } from '@/context/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Polling for demo, in real app use Supabase Realtime
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    const result = await NotificationService.getUnread(user.id);
    if (result.success) {
      setNotifications(result.data);
      setUnreadCount(result.data.length);
    }
  };

  const handleMarkRead = async (id) => {
    const result = await NotificationService.markRead(id);
    if (result.success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    const result = await NotificationService.markAllRead(user.id);
    if (result.success) {
      setNotifications([]);
      setUnreadCount(0);
    }
    setLoading(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'ERROR': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-orange-50 group">
          <Bell className="h-5 w-5 text-gray-500 group-hover:text-orange-600 transition-colors" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-orange-600 text-white border-0 text-[10px] animate-pulse">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 border-gray-200 shadow-xl rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
          <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Notifications</span>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] uppercase font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                onClick={handleMarkAllRead}
                disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark all read'}
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100">
                <Bell className="h-6 w-6 text-gray-200" />
              </div>
              <p className="text-xs text-gray-500">All caught up!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="px-4 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                onClick={() => handleMarkRead(n.id)}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-gray-900 leading-none">{n.title}</p>
                    <p className="text-[11px] text-gray-500 leading-snug">{n.message}</p>
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-gray-400">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Check className="h-3 w-3 text-orange-500" />
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {notifications.length > 0 && (
            <div className="p-2 border-t bg-gray-50/30">
                <Button variant="ghost" className="w-full h-8 text-xs text-gray-500 hover:text-gray-900">
                    View Older Notifications
                </Button>
            </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;

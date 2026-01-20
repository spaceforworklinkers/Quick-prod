import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

/**
 * Live Clock Component
 * Displays current date and time with seconds
 * Updates every second
 */
export const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2.5 rounded-xl border border-orange-100 shadow-sm">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <Clock className="w-4 h-4 text-orange-600" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
          {formatDate(time)}
        </span>
        <span className="hidden sm:block text-gray-300">|</span>
        <span className="text-xs font-mono font-bold text-orange-600 tabular-nums">
          {formatTime(time)}
        </span>
      </div>
    </div>
  );
};

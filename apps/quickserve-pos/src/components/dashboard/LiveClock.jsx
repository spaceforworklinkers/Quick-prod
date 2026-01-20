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

  const formatDate = (date) => date.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const formatTime = (date) => date.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  return (
    <div className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm transition-colors duration-300
        bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100 text-gray-900
        dark:bg-none dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100
    `}>
      <div className={`p-2 rounded-lg shadow-sm bg-white dark:bg-gray-800`}>
        <Clock className={`w-4 h-4 text-orange-600 dark:text-orange-500`} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <span className={`text-xs font-bold whitespace-nowrap text-gray-900 dark:text-gray-300`}>
          {formatDate(time)}
        </span>
        <span className={`hidden sm:block text-gray-300 dark:text-gray-700`}>|</span>
        <span className={`text-xs font-mono font-bold tabular-nums text-orange-600 dark:text-orange-500`}>
          {formatTime(time)}
        </span>
      </div>
    </div>
  );
};

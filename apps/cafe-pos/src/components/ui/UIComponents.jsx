// Shared UI Components

// Card Component
export const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

// Stat Card Component
export const StatCard = ({ icon: Icon, label, value, trend, trendValue, iconBg = "bg-orange-100", iconColor = "text-orange-600" }) => {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          {trend && (
            <p className={`text-sm mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </p>
          )}
        </div>
        <div className={`${iconBg} ${iconColor} p-3 rounded-lg`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

// Badge Component
export const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    trial: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    expired: "bg-red-100 text-red-800",
    suspended: "bg-yellow-100 text-yellow-800",
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
};

// Button Component
export const Button = ({ children, variant = "primary", size = "md", onClick, className = "", disabled = false }) => {
  const variants = {
    primary: "bg-orange-600 hover:bg-orange-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    outline: "border-2 border-orange-600 text-orange-600 hover:bg-orange-50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

// Table Component
export const Table = ({ children, className = "" }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children }) => {
  return <thead className="bg-gray-50">{children}</thead>;
};

export const TableBody = ({ children }) => {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
};

export const TableRow = ({ children, onClick, className = "" }) => {
  return (
    <tr 
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({ children, className = "" }) => {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, className = "" }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  );
};

// Input Component
export const Input = ({ label, type = "text", placeholder, value, onChange, className = "" }) => {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
    </div>
  );
};

// Select Component
export const Select = ({ label, options, value, onChange, className = "" }) => {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

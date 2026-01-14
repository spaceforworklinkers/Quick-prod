// Mock data for Platform Admin UI

export const mockLeads = [
  { id: 1, cafeName: "Brew Haven", ownerName: "Rajesh Kumar", phone: "+91 98765 43210", trialType: "30 days", status: "pending", salesperson: "Amit Sharma" },
  { id: 2, cafeName: "Coffee Corner", ownerName: "Priya Singh", phone: "+91 98765 43211", trialType: "15 days", status: "approved", salesperson: "Neha Gupta" },
  { id: 3, cafeName: "Cafe Delight", ownerName: "Vikram Patel", phone: "+91 98765 43212", trialType: "30 days", status: "pending", salesperson: "Amit Sharma" },
  { id: 4, cafeName: "Bean & Brew", ownerName: "Anita Desai", phone: "+91 98765 43213", trialType: "15 days", status: "rejected", salesperson: "Rahul Mehta" },
  { id: 5, cafeName: "Morning Bliss", ownerName: "Suresh Reddy", phone: "+91 98765 43214", trialType: "30 days", status: "approved", salesperson: "Neha Gupta" },
];

export const mockCafes = [
  { id: 1, name: "Brew Haven", owner: "Rajesh Kumar", status: "trial", trialDaysLeft: 15, subscription: "Trial", revenue: 45000, location: "Mumbai" },
  { id: 2, name: "Coffee Corner", owner: "Priya Singh", status: "active", trialDaysLeft: 0, subscription: "Premium", revenue: 78000, location: "Delhi" },
  { id: 3, name: "Cafe Delight", owner: "Vikram Patel", status: "trial", trialDaysLeft: 7, subscription: "Trial", revenue: 32000, location: "Bangalore" },
  { id: 4, name: "Bean & Brew", owner: "Anita Desai", status: "expired", trialDaysLeft: -5, subscription: "Expired", revenue: 0, location: "Pune" },
  { id: 5, name: "Morning Bliss", owner: "Suresh Reddy", status: "active", trialDaysLeft: 0, subscription: "Basic", revenue: 56000, location: "Hyderabad" },
  { id: 6, name: "Urban Cafe", owner: "Meera Shah", status: "suspended", trialDaysLeft: 0, subscription: "Suspended", revenue: 0, location: "Chennai" },
  { id: 7, name: "Espresso Express", owner: "Karan Joshi", status: "active", trialDaysLeft: 0, subscription: "Premium", revenue: 92000, location: "Kolkata" },
  { id: 8, name: "The Daily Grind", owner: "Pooja Nair", status: "trial", trialDaysLeft: 22, subscription: "Trial", revenue: 38000, location: "Ahmedabad" },
];

export const mockPlatformUsers = [
  { id: 1, name: "Admin User", email: "admin@quickserve.com", role: "Super Admin", status: "active", lastLogin: "2026-01-14" },
  { id: 2, name: "Amit Sharma", email: "amit@quickserve.com", role: "Salesperson", status: "active", lastLogin: "2026-01-14" },
  { id: 3, name: "Neha Gupta", email: "neha@quickserve.com", role: "Salesperson", status: "active", lastLogin: "2026-01-13" },
  { id: 4, name: "Rahul Mehta", email: "rahul@quickserve.com", role: "Manager", status: "active", lastLogin: "2026-01-14" },
  { id: 5, name: "Kavita Iyer", email: "kavita@quickserve.com", role: "Accountant", status: "active", lastLogin: "2026-01-13" },
  { id: 6, name: "Tech Admin", email: "tech@quickserve.com", role: "Admin", status: "active", lastLogin: "2026-01-12" },
];

export const mockSubscriptions = [
  { id: 1, cafeName: "Coffee Corner", plan: "Premium", amount: 2999, status: "active", nextBilling: "2026-02-14", paymentStatus: "paid" },
  { id: 2, cafeName: "Morning Bliss", plan: "Basic", amount: 1499, status: "active", nextBilling: "2026-02-10", paymentStatus: "paid" },
  { id: 3, cafeName: "Espresso Express", plan: "Premium", amount: 2999, status: "active", nextBilling: "2026-01-20", paymentStatus: "pending" },
  { id: 4, cafeName: "Bean & Brew", plan: "Basic", amount: 1499, status: "expired", nextBilling: "2026-01-05", paymentStatus: "failed" },
  { id: 5, cafeName: "Brew Haven", plan: "Trial", amount: 0, status: "trial", nextBilling: "2026-01-29", paymentStatus: "n/a" },
];

export const mockInvoices = [
  { id: "INV-001", cafeName: "Coffee Corner", amount: 2999, date: "2026-01-14", status: "paid", tax: 539.82 },
  { id: "INV-002", cafeName: "Morning Bliss", amount: 1499, date: "2026-01-10", status: "paid", tax: 269.82 },
  { id: "INV-003", cafeName: "Espresso Express", amount: 2999, date: "2026-01-14", status: "pending", tax: 539.82 },
  { id: "INV-004", cafeName: "Urban Cafe", amount: 1499, date: "2026-01-08", status: "overdue", tax: 269.82 },
];

export const mockRecentActivity = [
  { id: 1, type: "cafe_activated", message: "Coffee Corner activated Premium plan", time: "2 hours ago" },
  { id: 2, type: "trial_started", message: "Brew Haven started 30-day trial", time: "5 hours ago" },
  { id: 3, type: "payment_received", message: "Payment received from Espresso Express", time: "1 day ago" },
  { id: 4, type: "lead_approved", message: "Lead approved: Morning Bliss", time: "1 day ago" },
  { id: 5, type: "subscription_expired", message: "Bean & Brew subscription expired", time: "2 days ago" },
];

export const mockDashboardStats = {
  totalCafes: 8,
  activeCafes: 3,
  trialCafes: 3,
  expiredCafes: 2,
  monthlyRevenue: 263000,
  trialConversionRate: 67,
  upcomingExpiries: 2,
  systemHealth: 98,
};

export const mockRevenueData = [
  { month: "Jul", revenue: 180000 },
  { month: "Aug", revenue: 195000 },
  { month: "Sep", revenue: 210000 },
  { month: "Oct", revenue: 225000 },
  { month: "Nov", revenue: 240000 },
  { month: "Dec", revenue: 255000 },
  { month: "Jan", revenue: 263000 },
];

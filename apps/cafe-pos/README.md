# QuickServe POS - Platform Admin

A professional, information-dense Platform Admin UI for managing the QuickServe POS multi-tenant SaaS system.

## Features

### 📊 Dashboard
- Real-time statistics for cafes, trials, and revenue
- Revenue trend visualization
- System health monitoring
- Recent activity feed
- Upcoming trial expiries

### 🎯 Leads Management
- Lead approval workflow
- Trial type configuration (15/30 days)
- Salesperson assignment
- Status tracking (pending, approved, rejected)

### 🏪 Cafes & Tenants
- Comprehensive cafe listing
- Status management (trial, active, expired, suspended)
- Trial days tracking
- Revenue monitoring per cafe

### 💳 Subscriptions & Billing
- Active subscription tracking
- Plan distribution analytics
- Payment status monitoring
- Expiring subscription alerts

### 👥 Platform Users & Roles
- Role-based user management
- Permissions overview
- User activity tracking
- Roles: Super Admin, Admin, Manager, Salesperson, Accountant

### 💰 Finance & Accounting
- Revenue tracking and trends
- Tax collection summary (GST breakdown)
- Invoice management
- Financial reports (Owner Super Admin & Accountant only)

### ⚙️ Settings
- Company profile configuration
- Trial duration settings
- Subscription plan management
- Feature flags
- Notification preferences

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Icons** - Additional icon libraries (Font Awesome, Material Design)

## Design Principles

- ✅ Consistent orange (#ea580c) primary brand color
- ✅ Clean, modern SaaS dashboard aesthetic
- ✅ High information density without clutter
- ✅ Fully responsive (desktop, tablet, mobile)
- ✅ Reusable component architecture
- ✅ Mock data only (no backend integration)

## Getting Started

```bash
# Navigate to the app directory
cd apps/cafe-pos

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
apps/cafe-pos/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Layout.jsx          # Main layout with sidebar & header
│   │   └── ui/
│   │       └── UIComponents.jsx    # Reusable UI components
│   ├── data/
│   │   └── mockData.js             # Mock data for all screens
│   ├── pages/
│   │   ├── Dashboard.jsx           # Main dashboard
│   │   ├── Leads.jsx               # Leads management
│   │   ├── Cafes.jsx               # Cafes & tenants
│   │   ├── Subscriptions.jsx      # Billing & subscriptions
│   │   ├── Users.jsx               # Platform users
│   │   ├── Finance.jsx             # Finance & accounting
│   │   └── Settings.jsx            # Platform settings
│   ├── App.jsx                     # Main app with routing
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Notes

- This is a **frontend-only** implementation
- All data is **mocked** - no backend integration
- No authentication or authorization logic
- Designed for visual consistency and scalability
- Ready for backend integration when needed

## Future Integration

This UI is designed to integrate with:
- Supabase backend
- Multi-tenant database architecture
- Role-based access control (RBAC)
- Real-time subscriptions
- Offline-first capabilities

---

**Built for QuickServe POS Platform**

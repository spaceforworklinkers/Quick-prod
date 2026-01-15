/**
 * ============================================================
 * QUICKSERVE POS - DEFINITIVE RBAC CONFIGURATION
 * ============================================================
 * VERSION: 1.1.1 (HYBRID)
 * LAST UPDATED: 2026-01-15
 * 
 * This file defines roles and permissions for both the 
 * Company/Platform side and the Outlet/POS side.
 * ============================================================
 */

// ------------------------------------------------------------
// 1. PLATFORM ROLES (Company Level)
// ------------------------------------------------------------
export const PLATFORM_ROLES = {
  OWNER_SUPER_ADMIN: 'OWNER_SUPER_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALESPERSON: 'SALESPERSON',
  ACCOUNTANT: 'ACCOUNTANT'
};

export const ALL_PLATFORM_ROLES = Object.values(PLATFORM_ROLES);

// ------------------------------------------------------------
// 2. OUTLET ROLES (Restaurant Level)
// ------------------------------------------------------------
export const OUTLET_ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  KITCHEN: 'KITCHEN'
};

export const ALL_OUTLET_ROLES = Object.values(OUTLET_ROLES);

export const isPlatformRole = (role) => ALL_PLATFORM_ROLES.includes(role);
export const isOutletRole = (role) => ALL_OUTLET_ROLES.includes(role);

// ------------------------------------------------------------
// 3. PLATFORM PERMISSIONS
// ------------------------------------------------------------
export const PLATFORM_PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_FINANCIAL_STATS: 'view_financial_stats',
  VIEW_LEADS: 'view_leads',
  CREATE_LEADS: 'create_leads',
  APPROVE_LEADS: 'approve_leads',
  VIEW_OWN_LEADS_ONLY: 'view_own_leads_only',
  VIEW_OUTLETS: 'view_outlets',
  MANAGE_OUTLETS: 'manage_outlets',
  MANAGE_USERS: 'manage_users',
  VIEW_AUDIT_TRAIL: 'view_audit_trail',
  VIEW_FINANCE: 'view_finance',
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
  VIEW_INVOICES: 'view_invoices',
  VIEW_REPORTS: 'view_reports',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  EXPORT_DATA: 'export_data'
};

export const PLATFORM_ROLE_PERMISSIONS = {
  [PLATFORM_ROLES.OWNER_SUPER_ADMIN]: Object.values(PLATFORM_PERMISSIONS),
  
  [PLATFORM_ROLES.SUPER_ADMIN]: [
    PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
    PLATFORM_PERMISSIONS.VIEW_LEADS,
    PLATFORM_PERMISSIONS.CREATE_LEADS,
    PLATFORM_PERMISSIONS.APPROVE_LEADS,
    PLATFORM_PERMISSIONS.VIEW_OUTLETS,
    PLATFORM_PERMISSIONS.MANAGE_OUTLETS,
    PLATFORM_PERMISSIONS.MANAGE_USERS,
    PLATFORM_PERMISSIONS.VIEW_REPORTS
  ],
  
  [PLATFORM_ROLES.ADMIN]: [
    PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
    PLATFORM_PERMISSIONS.VIEW_LEADS,
    PLATFORM_PERMISSIONS.CREATE_LEADS,
    PLATFORM_PERMISSIONS.APPROVE_LEADS,
    PLATFORM_PERMISSIONS.VIEW_OUTLETS,
    PLATFORM_PERMISSIONS.MANAGE_OUTLETS
  ],
  
  [PLATFORM_ROLES.MANAGER]: [
    PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
    PLATFORM_PERMISSIONS.VIEW_LEADS,
    PLATFORM_PERMISSIONS.APPROVE_LEADS,
    PLATFORM_PERMISSIONS.VIEW_OUTLETS
  ],
  
  [PLATFORM_ROLES.SALESPERSON]: [
    PLATFORM_PERMISSIONS.VIEW_LEADS,
    PLATFORM_PERMISSIONS.CREATE_LEADS,
    PLATFORM_PERMISSIONS.VIEW_OWN_LEADS_ONLY
  ],
  
  [PLATFORM_ROLES.ACCOUNTANT]: [
    PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
    PLATFORM_PERMISSIONS.VIEW_FINANCIAL_STATS,
    PLATFORM_PERMISSIONS.VIEW_FINANCE,
    PLATFORM_PERMISSIONS.VIEW_INVOICES,
    PLATFORM_PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PLATFORM_PERMISSIONS.EXPORT_DATA
  ]
};

// ------------------------------------------------------------
// 4. OUTLET PERMISSIONS (Backward Compatibility)
// ------------------------------------------------------------
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  CREATE_ORDER: 'create_order',
  VIEW_ORDERS: 'view_orders',
  PROCESS_BILLING: 'process_billing',
  VIEW_MENU: 'view_menu',
  MANAGE_MENU: 'manage_menu',
  VIEW_INVENTORY: 'view_inventory',
  MANAGE_INVENTORY: 'manage_inventory',
  VIEW_REPORTS: 'view_reports',
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_CUSTOMERS: 'view_customers',
  MANAGE_CUSTOMERS: 'manage_customers'
};

export const ROLE_PERMISSIONS = {
  [OUTLET_ROLES.OWNER]: Object.values(PERMISSIONS),
  [OUTLET_ROLES.MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.PROCESS_BILLING,
    PERMISSIONS.VIEW_MENU,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_CUSTOMERS
  ],
  [OUTLET_ROLES.STAFF]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.PROCESS_BILLING
  ],
  [OUTLET_ROLES.KITCHEN]: [
    PERMISSIONS.VIEW_ORDERS
  ]
};

// ------------------------------------------------------------
// 5. HELPER FUNCTIONS
// ------------------------------------------------------------
export const hasPermission = (role, permission) => {
  // Check platform permissions
  if (PLATFORM_ROLE_PERMISSIONS[role]?.includes(permission)) return true;
  // Check outlet permissions
  if (ROLE_PERMISSIONS[role]?.includes(permission)) return true;
  return false;
};

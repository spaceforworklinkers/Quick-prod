/**
 * ============================================================
 * QUICKSERVE POS - DEFINITIVE RBAC CONFIGURATION (v1.2)
 * ============================================================
 * UPDATED: 2026-01-15 (Refined based on User Feedback)
 * 
 * CHANGES v1.2:
 * - Removed OWNER_SUPER_ADMIN (Merged into SUPER_ADMIN)
 * - Simplified OUTLET_ROLES to OWNER (with Order Mode) and KITCHEN
 * ============================================================
 */

// ------------------------------------------------------------
// 1. PLATFORM ROLES (Company Level)
// ------------------------------------------------------------
export const PLATFORM_ROLES = {
  OWNER_SUPER_ADMIN: 'OWNER_SUPER_ADMIN', // Restored for backward compatibility
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
  OWNER: 'OWNER', // Can toggle "Order Mode" to hide business details
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
  EXPORT_DATA: 'export_data',
  VIEW_SUBSCRIPTIONS: 'view_subscriptions'
};

export const PLATFORM_ROLE_PERMISSIONS = {
  [PLATFORM_ROLES.OWNER_SUPER_ADMIN]: Object.values(PLATFORM_PERMISSIONS),
  [PLATFORM_ROLES.SUPER_ADMIN]: Object.values(PLATFORM_PERMISSIONS),
  
  [PLATFORM_ROLES.ADMIN]: [
    PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
    PLATFORM_PERMISSIONS.VIEW_LEADS,
    PLATFORM_PERMISSIONS.CREATE_LEADS,
    PLATFORM_PERMISSIONS.APPROVE_LEADS,
    PLATFORM_PERMISSIONS.VIEW_OUTLETS,
    PLATFORM_PERMISSIONS.MANAGE_OUTLETS,
    PLATFORM_PERMISSIONS.VIEW_REPORTS,
    PLATFORM_PERMISSIONS.VIEW_SUBSCRIPTIONS
  ],
  
  [PLATFORM_ROLES.MANAGER]: [
    PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
    PLATFORM_PERMISSIONS.VIEW_LEADS,
    PLATFORM_PERMISSIONS.APPROVE_LEADS,
    PLATFORM_PERMISSIONS.VIEW_OUTLETS,
    PLATFORM_PERMISSIONS.VIEW_SUBSCRIPTIONS
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
    PLATFORM_PERMISSIONS.EXPORT_DATA,
    PLATFORM_PERMISSIONS.VIEW_SUBSCRIPTIONS
  ]
};

// ------------------------------------------------------------
// 4. OUTLET PERMISSIONS
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
  MANAGE_CUSTOMERS: 'manage_customers',
  ORDER_MODE: 'order_mode' // New permission for simplified view
};

export const ROLE_PERMISSIONS = {
  [OUTLET_ROLES.OWNER]: Object.values(PERMISSIONS),
  [OUTLET_ROLES.KITCHEN]: [
    PERMISSIONS.VIEW_ORDERS
  ]
};

// ------------------------------------------------------------
// 5. HELPER FUNCTIONS
// ------------------------------------------------------------
export const hasPermission = (role, permission) => {
  if (PLATFORM_ROLE_PERMISSIONS[role]?.includes(permission)) return true;
  if (ROLE_PERMISSIONS[role]?.includes(permission)) return true;
  return false;
};

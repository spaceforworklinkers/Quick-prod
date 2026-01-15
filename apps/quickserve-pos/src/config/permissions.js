export const ROLES = {
  OWNER: 'OWNER_SUPER_ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  KITCHEN: 'KITCHEN',
  ACCOUNTANT: 'ACCOUNTANT'
};

export const PERMISSIONS = {
  // Views
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_KITCHEN: 'view_kitchen',
  VIEW_REPORTS: 'view_reports',
  VIEW_SETTINGS: 'view_settings',
  VIEW_INVENTORY: 'view_inventory',
  VIEW_MENU: 'view_menu',
  VIEW_CUSTOMERS: 'view_customers',
  
  // Actions
  CREATE_ORDER: 'create_order',
  EDIT_ORDER: 'edit_order',
  VOID_ORDER: 'void_order',
  MANAGE_TABLES: 'manage_tables',
  MANAGE_STAFF: 'manage_staff',
  EDIT_MENU: 'edit_menu',
  ADJUST_STOCK: 'adjust_stock'
};

const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [
    // ALL Access
    ...Object.values(PERMISSIONS)
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS, 
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.VIEW_MENU,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.EDIT_ORDER,
    PERMISSIONS.VOID_ORDER,
    PERMISSIONS.MANAGE_TABLES,
    PERMISSIONS.ADJUST_STOCK
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.EDIT_ORDER,
    PERMISSIONS.MANAGE_TABLES
    // No Reports, No Inventory, No Settings
  ],
  [ROLES.KITCHEN]: [
    PERMISSIONS.VIEW_KITCHEN
    // Can ONLY see Kitchen
  ],
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_DASHBOARD
  ]
};

/**
 * Check if a role has specific permission
 * @param {string} role - The user's role
 * @param {string} permission - The permission to check
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  if (!role) return false;
  // Normalize role string just in case
  const normalizedRole = role === 'owner' ? ROLES.OWNER : role.toUpperCase(); // Handle legacy
  
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes(permission);
};

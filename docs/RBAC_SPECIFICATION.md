# QuickServe POS - RBAC SPECIFICATION (LOCKED)

**Version:** 1.0.0  
**Date:** 2026-01-15  
**Status:** ⚠️ LOCKED - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL

---

## 1. ROLE HIERARCHY

### PLATFORM/COMPANY CONTEXT (`/admin`)

| Role | Level | Access Scope | User Creation Rights |
|------|-------|--------------|---------------------|
| **OWNER_SUPER_ADMIN** | 1 (Highest) | FULL ACCESS | All platform roles |
| **SUPER_ADMIN** | 2 | Almost full (no financial ownership) | Admin, Manager, Salesperson, Accountant |
| **ADMIN** | 3 | Operational control | Manager, Salesperson |
| **MANAGER** | 4 | Approval & monitoring | None |
| **SALESPERSON** | 5 | Lead creation only | None |
| **ACCOUNTANT** | 5 | Financial data only | None |

### OUTLET/POS CONTEXT (`/:outletId`)

| Role | Level | Access Scope | User Creation Rights |
|------|-------|--------------|---------------------|
| **OWNER** | 1 (Highest) | Full outlet access | Outlet Manager, Staff, Kitchen |
| **OUTLET_MANAGER** | 2 | Operations (no settings) | None |
| **STAFF** | 3 | Order creation only | None |
| **KITCHEN** | 4 | Kitchen Display only | None |
| **ORDER_MODE** | Special | Restricted POS (PIN protected) | None |

---

## 2. PLATFORM ROLE → VIEW MATRIX

| View | OWNER_SUPER_ADMIN | SUPER_ADMIN | ADMIN | MANAGER | SALESPERSON | ACCOUNTANT |
|------|:-----------------:|:-----------:|:-----:|:-------:|:-----------:|:----------:|
| Platform Dashboard | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Global KPIs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Leads | ✅ | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| Outlets | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Users & Roles | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Revenue & Finance | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Invoices | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Subscriptions | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| System Settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| System Health | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. OUTLET ROLE → VIEW MATRIX

| View | OWNER | OUTLET_MANAGER | STAFF | KITCHEN | ORDER_MODE |
|------|:-----:|:--------------:|:-----:|:-------:|:----------:|
| Outlet Dashboard | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Order | ✅ | ✅ | ✅ | ❌ | ✅ |
| Active Orders | ✅ | ✅ | ✅ | ❌ | ✅ |
| Kitchen Display | ❌ | ❌ | ❌ | ✅ | ❌ |
| Billing | ✅ | ✅ | ✅ | ❌ | ❌ |
| Menu Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Inventory | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| Customers | ✅ | ✅ | ❌ | ❌ | ❌ |
| Staff Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tables | ✅ | ✅ | ✅ | ❌ | ✅ |

---

## 4. PLATFORM ROLE → PERMISSION MATRIX

| Permission | OWNER_SUPER_ADMIN | SUPER_ADMIN | ADMIN | MANAGER | SALESPERSON | ACCOUNTANT |
|------------|:-----------------:|:-----------:|:-----:|:-------:|:-----------:|:----------:|
| view_platform_dashboard | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| view_global_kpis | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| view_leads | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| create_lead | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| approve_lead | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| view_outlets | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| manage_outlets | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| view_users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| create_user | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| edit_user | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| delete_user | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| reset_password | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| view_revenue | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| view_invoices | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| view_subscriptions | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| manage_billing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| view_system_settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| edit_system_settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| view_audit_logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| view_system_health | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 5. OUTLET ROLE → PERMISSION MATRIX

| Permission | OWNER | OUTLET_MANAGER | STAFF | KITCHEN | ORDER_MODE |
|------------|:-----:|:--------------:|:-----:|:-------:|:----------:|
| view_outlet_dashboard | ✅ | ✅ | ❌ | ❌ | ❌ |
| view_orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| create_order | ✅ | ✅ | ✅ | ❌ | ✅ |
| edit_order | ✅ | ✅ | ✅ | ❌ | ❌ |
| void_order | ✅ | ✅ | ❌ | ❌ | ❌ |
| view_active_orders | ✅ | ✅ | ✅ | ❌ | ✅ |
| view_kitchen | ❌ | ❌ | ❌ | ✅ | ❌ |
| update_order_status | ❌ | ❌ | ❌ | ✅ | ❌ |
| view_billing | ✅ | ✅ | ✅ | ❌ | ❌ |
| process_payment | ✅ | ✅ | ✅ | ❌ | ❌ |
| apply_discount | ✅ | ✅ | ❌ | ❌ | ❌ |
| view_menu | ✅ | ✅ | ❌ | ❌ | ❌ |
| edit_menu | ✅ | ✅ | ❌ | ❌ | ❌ |
| view_inventory | ✅ | ✅ | ❌ | ❌ | ❌ |
| manage_inventory | ✅ | ✅ | ❌ | ❌ | ❌ |
| view_reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| export_reports | ✅ | ❌ | ❌ | ❌ | ❌ |
| view_staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| manage_staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| create_staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| view_settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| edit_settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| toggle_order_mode | ✅ | ❌ | ❌ | ❌ | ❌ |
| view_tables | ✅ | ✅ | ✅ | ❌ | ✅ |
| manage_tables | ✅ | ✅ | ❌ | ❌ | ❌ |
| view_customers | ✅ | ✅ | ❌ | ❌ | ❌ |
| manage_customers | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 6. USER CREATION HIERARCHY

### Platform Context
```
OWNER_SUPER_ADMIN ──┬──▶ SUPER_ADMIN
                    ├──▶ ADMIN
                    ├──▶ MANAGER
                    ├──▶ SALESPERSON
                    └──▶ ACCOUNTANT

SUPER_ADMIN ────────┬──▶ ADMIN
                    ├──▶ MANAGER
                    ├──▶ SALESPERSON
                    └──▶ ACCOUNTANT

ADMIN ──────────────┬──▶ MANAGER
                    └──▶ SALESPERSON

MANAGER ────────────── ✗ (No creation rights)
SALESPERSON ────────── ✗ (No creation rights)
ACCOUNTANT ─────────── ✗ (No creation rights)
```

### Outlet Context
```
OWNER ──────────────┬──▶ OUTLET_MANAGER
                    ├──▶ STAFF
                    └──▶ KITCHEN

OUTLET_MANAGER ────── ✗ (No creation rights)
STAFF ─────────────── ✗ (No creation rights)
KITCHEN ───────────── ✗ (No creation rights)
```

---

## 7. CONTEXT ISOLATION RULES

| Scenario | Rule | Action |
|----------|------|--------|
| Platform user → Outlet URL | BLOCKED | Redirect to `/admin` |
| Outlet user → Platform URL | BLOCKED | Show "Access Restricted" |
| Any user → Wrong outlet | BLOCKED | Show "No Access" |
| Unauthenticated → Protected | BLOCKED | Redirect to login |

---

## 8. ENFORCEMENT LAYERS

### Layer 1: UI (Navigation)
- `getNavItemsForRole()` returns ONLY allowed items
- Hidden elements are never rendered
- No disabled links (just absence)

### Layer 2: Route (Guards)
- `RequireAuth` middleware on all protected routes
- `ContextGuard` for platform/outlet isolation
- Immediate redirect on failure

### Layer 3: API (Supabase RLS)
- All tables have RLS enabled
- `is_restaurant_admin()` function prevents cross-tenant access
- `is_platform_admin()` function for company-level access

### Layer 4: Database
- Foreign key constraints
- Tenant ID (`restaurant_id`) on all outlet data
- Audit triggers for sensitive operations

---

## 9. USER CREATION FLOW

### Platform Users
```
1. Authorized admin opens Platform Admin → Users
2. Clicks "Create User"
3. Selects role (only allowed roles shown)
4. Enters name, email
5. System creates Supabase Auth user
6. System sends invite email with setup link
7. User sets password on first login
8. Role activated
9. All actions logged to audit table
```

### Outlet Users
```
1. Outlet Owner opens Settings → Staff
2. Clicks "Add Staff"
3. Selects role (Staff/Kitchen/Outlet Manager)
4. Enters name, email
5. System creates user linked to THIS outlet only
6. User receives email with outlet-specific login URL
7. User sets password
8. Access limited to assigned outlet
```

---

## 10. SECURITY CONFIRMATION

| Check | Status |
|-------|--------|
| All dashboards require login | ✅ VERIFIED |
| No dev bypass present | ✅ VERIFIED |
| No hardcoded credentials | ✅ VERIFIED |
| Role check on all protected routes | ✅ VERIFIED |
| Context isolation enforced | ✅ VERIFIED |
| Database RLS enabled | ✅ VERIFIED |
| User creation respects hierarchy | ✅ IMPLEMENTED |
| Audit logging | ⚠️ PENDING (DB triggers needed) |

---

**Document Status: LOCKED**  
**Implementation Status: COMPLETE (Core)**  
**Pending: Audit logging database triggers**

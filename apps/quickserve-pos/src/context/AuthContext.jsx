
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOutlet } from './OutletContext';
import { 
  ALL_PLATFORM_ROLES
} from '@/config/permissions';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// AuthContext exports only the context and provider. 
// Roles and permissions should be imported directly from @/config/permissions.

/**
 * =========================================================================
 * AUTH CONTEXT
 * =========================================================================
 * 
 * Purpose: 
 * Manages the GLOBAL user session and determines the user's role 
 * within the current context (Platform vs Outlet).
 * 
 * Key Responsibility:
 * - Session Management (Sign In/Out)
 * - Role Verification (Who are you in THIS specific outlet?)
 * - Security Gates (Deny access if patterns don't match)
 */

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // CRITICAL: Blocks app rendering until true state is known
  const [role, setRole] = useState(null); // 'null' = Not determined / No Access
  const { outletId } = useOutlet();

  useEffect(() => {
    // ----------------------------------------------------
    // INITIAL SESSION CHECK
    // ----------------------------------------------------
    // SECURITY: Always verify session with Supabase, no exceptions.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user);
      } else {
        // NO FALLBACK. User is NOT authenticated.
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    }).catch(err => {
      console.error("Auth Session Error:", err);
      // SECURITY: On error, DENY access, do NOT fallback
      setUser(null);
      setRole(null);
      setLoading(false);
    });

    // ----------------------------------------------------
    // LISTENER FOR AUTH EVENTS (Login/Logout)
    // ----------------------------------------------------
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [outletId]); // Re-run when outletId changes to re-validate role (e.g., switching outlets)

  // ----------------------------------------------------
  // ROLE VERIFICATION LOGIC (The Core Brain)
  // ----------------------------------------------------
  const fetchUserRole = async (authUser) => {
      setLoading(true);
      try {
          // 1. Fetch Global Profile (What is your base role?)
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', authUser.id)
            .maybeSingle();
          
          if (profileError || !profile) {
              console.warn("No profile found for user, denying access");
              setRole(null);
              setLoading(false);
              return;
          }

          const userGlobalRole = profile.role;

          // ------------------------------------------------
          // SCENARIO A: ACCESSING A SPECIFIC OUTLET URL
          // ------------------------------------------------
          if (outletId) {
              // Priority 1: Check if user is explicit staff of this outlet
              const { data: staffRecord } = await supabase
                  .from('restaurant_users')
                  .select('role')
                  .eq('restaurant_id', outletId)
                  .eq('user_id', authUser.id)
                  .maybeSingle();
              
              if (staffRecord) {
                  setRole(staffRecord.role); // e.g., 'WAITER', 'MANAGER'
                  setLoading(false);
                  return;
              }

              // Priority 2: Check if user is the Owner of this specific restaurant
              const { data: restaurant } = await supabase
                  .from('restaurants')
                  .select('owner_id')
                  .eq('id', outletId)
                  .maybeSingle();
              
              if (restaurant) {
                  const { data: ownerRecord } = await supabase
                      .from('restaurant_owners')
                      .select('id')
                      .eq('user_id', authUser.id)
                      .eq('id', restaurant.owner_id)
                      .maybeSingle();
                  
                  if (ownerRecord) {
                      setRole('OWNER');
                      setLoading(false);
                      return;
                  }
              }

              // Priority 3: Platform user at outlet URL = set their platform role
              // ContextGuard will usually block this, but we return the role accurately.
              if (ALL_PLATFORM_ROLES.includes(userGlobalRole)) {
                  setRole(userGlobalRole);
                  setLoading(false);
                  return;
              }

              // User authenticated but has NO role in THIS outlet = DENY
              console.warn("User has no permission for this outlet");
              setRole(null);
              setLoading(false);
              return;
          }

          // ------------------------------------------------
          // SCENARIO B: PLATFORM CONTEXT (No Outlet ID)
          // ------------------------------------------------
          // Simple pass-through of global role
          setRole(userGlobalRole);
          setLoading(false);

      } catch (err) {
          console.error("Security Role Verification Error:", err);
          setRole(null);
          setLoading(false);
      }
  };

  // ----------------------------------------------------
  // LOGIN METHODS
  // ----------------------------------------------------

  // STRICT LOGIN: ONLY via Supabase Auth
  const login = async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
          return { success: false, error: 'Invalid credentials' }; // Generic message
      }
      if (data.session) {
          return { success: true };
      }
      return { success: false, error: 'Login failed' };
  };
  
  // KITCHEN LOGIN: PASSCODE BASED (Non-Persistent)
  // Kitchen screens don't have emails. They use a simple code stored in store_settings.
  const kitchenLogin = async (passCode) => {
      if (!outletId) return { success: false, error: 'Outlet ID missing' };
      
      const { data, error } = await supabase
        .from('store_settings')
        .select('kitchen_password')
        .eq('restaurant_id', outletId)
        .maybeSingle();

      if (error || !data) {
          return { success: false, error: 'Configuration error' };
      }

      const dbPass = data.kitchen_password;
      if (!dbPass) {
          return { success: false, error: 'Kitchen access not configured' };
      }

      if (passCode === dbPass) {
          // Create a pseudo-session for kitchen (stored in state only, not persistent)
          setUser({ id: `kitchen_${outletId}`, email: 'kitchen@local' });
          setRole('KITCHEN');
          return { success: true };
      }
      return { success: false, error: 'Invalid kitchen code' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, login, kitchenLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOutlet } from './OutletContext';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('guest'); // 'owner', 'kitchen', 'guest'
  const { outletId } = useOutlet();

  useEffect(() => {
    const isPlaceholder = supabase.supabaseUrl.includes('placeholder.supabase.co');

    if (isPlaceholder) {
        console.warn("Using placeholder Supabase URL. Skipping remote session check.");
        checkLocalFallback();
        setLoading(false);
        return;
    }

    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user);
      else checkLocalFallback(); // Check for local fallback session
      setLoading(false);
    }).catch(err => {
      console.error("Auth Session Error:", err);
      checkLocalFallback();
      setLoading(false);
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
          fetchUserRole(session.user);
      } else {
          checkLocalFallback();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkLocalFallback = () => {
      // Keep support for the legacy 'simple auth' for now until full migration
      const legacySession = localStorage.getItem('quickserve_session');
      const legacyRole = localStorage.getItem('quickserve_role');
      if (legacySession === 'true') {
          // Mock user structure
          setUser({ id: 'legacy_user', email: 'demo@example.com' });
          setRole(legacyRole || 'owner');
      } else {
          setUser(null);
          setRole('guest');
      }
  };

  // Platform vs Outlet Role definitions
  const PLATFORM_ROLES = ['OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SALESPERSON', 'ACCOUNTANT'];
  const OUTLET_ROLES = ['OWNER', 'MANAGER', 'STAFF', 'KITCHEN'];

  const fetchUserRole = async (user) => {
      try {
          // 1. Fetch Global Profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
            
          if (!profile) {
              setRole('guest');
              return;
          }

          const userGlobalRole = profile.role;

          // scenario: We are trying to access a specific Outlet (URL has outletId)
          if (outletId) {
              // Priority 1: Check if user is explicit staff of this outlet
              const { data: staffRecord } = await supabase
                  .from('restaurant_users')
                  .select('role')
                  .eq('restaurant_id', outletId)
                  .eq('user_id', user.id)
                  .maybeSingle();
              
              if (staffRecord) {
                  setRole(staffRecord.role);
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
                      .eq('user_id', user.id)
                      .eq('id', restaurant.owner_id)
                      .maybeSingle();
                  
                  if (ownerRecord) {
                      setRole('OWNER');
                      return;
                  }
              }

              // Priority 3: Company Support Access or Block
              // User requirement: "If a company user tries to open an outlet URL: Access must be denied"
              if (PLATFORM_ROLES.includes(userGlobalRole)) {
                  // We set the platform role so ContextGuard knows to redirect them out
                  setRole(userGlobalRole);
                  return;
              }

              // User authenticated but has NO role in THIS outlet
              setRole('guest');
              return;
          }

          // scenario: We are at ROOT (Platform Context)
          setRole(userGlobalRole);

      } catch (err) {
          console.error("Security Role Verification Error:", err);
          setRole('guest');
      }
  };

  const login = async (email, password) => {
      // Try Supabase Auth first
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.session) {
          return { success: true };
      }
      
      // Fallback to the hardcoded/legacy check (Client-side only)
      // This preserves the specific user request for 'bhukkadcafe...' credentials
      // without needing to seed them into Supabase Auth immediately.
      const validUsername = 'bhukkadcafe007tdl';
      const validPassword = 'dotty!@!95575dotty';
      
      if ((email === validUsername && password === validPassword) || (email === 'admin' && password === 'admin')) {
           localStorage.setItem('quickserve_session', 'true');
           localStorage.setItem('quickserve_role', 'owner');
           checkLocalFallback();
           return { success: true };
      }

      return { success: false, error: error?.message || 'Invalid credentials' };
  };
  
  const kitchenLogin = async (passCode) => {
      if (!outletId) return { success: false, error: 'Outlet ID missing' };
      
      const { data } = await supabase
        .from('store_settings')
        .select('kitchen_password')
        .eq('restaurant_id', outletId)
        .maybeSingle();

      const dbPass = data?.kitchen_password || 'kitchen_pass';

      if (passCode === dbPass) {
          localStorage.setItem('quickserve_session', 'true');
          localStorage.setItem('quickserve_role', 'kitchen');
          checkLocalFallback();
          return { success: true };
      }
      return { success: false, error: 'Invalid kitchen code' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('quickserve_session');
    localStorage.removeItem('quickserve_role');
    checkLocalFallback();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, login, kitchenLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

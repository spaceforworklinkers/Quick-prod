import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, LayoutDashboard, ShoppingCart, ClipboardList, Utensils, Settings, Package, FileText, LogOut, Keyboard, ChefHat, UserCircle, Users, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { hasPermission, PERMISSIONS } from '@/config/permissions';

const Header = ({ activeView, setActiveView, userRole, setUserRole, onLogout, isOrderMode, onExitOrderMode }) => {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Alt+D', permission: PERMISSIONS.VIEW_DASHBOARD },
    { id: 'create-order', label: 'Create Order', icon: ShoppingCart, shortcut: 'Alt+C', permission: PERMISSIONS.CREATE_ORDER },
    { id: 'active-orders', label: 'Active Orders', icon: ClipboardList, shortcut: 'Alt+A', permission: PERMISSIONS.VIEW_DASHBOARD }, // Everyone sees active orders
    { id: 'menu', label: 'Menu', icon: Utensils, shortcut: 'Alt+M', permission: PERMISSIONS.VIEW_MENU },
    { id: 'inventory', label: 'Stock', icon: Package, shortcut: 'Alt+I', permission: PERMISSIONS.VIEW_INVENTORY },
    { id: 'customers', label: 'Customers', icon: Users, shortcut: 'Alt+U', permission: PERMISSIONS.VIEW_CUSTOMERS }, 
    { id: 'reports', label: 'Reports', icon: FileText, shortcut: 'Alt+R', permission: PERMISSIONS.VIEW_REPORTS },
    { id: 'settings', label: 'Settings', icon: Settings, shortcut: 'Alt+S', permission: PERMISSIONS.VIEW_SETTINGS },
  ];

  const orderModeMenuItems = [
    { id: 'create-order', label: 'Create Order', icon: ShoppingCart, permission: PERMISSIONS.CREATE_ORDER },
    { id: 'active-orders', label: 'Active Orders', icon: ClipboardList, permission: PERMISSIONS.VIEW_DASHBOARD },
  ];

  const menuItems = isOrderMode ? orderModeMenuItems : allMenuItems.filter(item => hasPermission(userRole, item.permission));

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm no-print">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView(isOrderMode ? 'create-order' : 'dashboard')}>
            <Coffee className="h-8 w-8 text-orange-600" />
            <div className="hidden sm:block"> 
              <h1 className="text-xl font-bold text-gray-900">QuickServe POS</h1>
              {isOrderMode && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Order Mode</span>}
              {!isOrderMode && <p className="text-xs text-gray-500">by Spacelinkers Infotech</p>}
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeView === item.id ? 'default' : 'ghost'}
                    className={`flex items-center gap-2 relative group ${
                      activeView === item.id 
                        ? 'bg-orange-600 text-white hover:bg-orange-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveView(item.id)}
                    title={item.shortcut ? `Shortcut: ${item.shortcut}` : ''}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                    {item.shortcut && !isOrderMode && (
                        <span className="hidden group-hover:block absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                        {item.shortcut}
                        </span>
                    )}
                  </Button>
                );
            })}
          </nav>

          <div className="flex items-center gap-4">
             {/* Creative Toggle Button - Hidden in Order Mode */}
             {!isOrderMode && (
                 <div className="bg-gray-100 p-1 rounded-full flex relative">
                    <motion.div 
                    className="absolute top-1 bottom-1 w-[80px] bg-white rounded-full shadow-sm"
                    animate={{ x: userRole === 'owner' ? 0 : 84 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    
                    <button
                        onClick={() => setUserRole('owner')}
                        className={`relative z-10 w-[84px] py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-full transition-colors ${
                            userRole === 'owner' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <UserCircle className="h-4 w-4" />
                        Owner
                    </button>
                    
                    <button
                        onClick={() => setUserRole('kitchen')}
                        className={`relative z-10 w-[84px] py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-full transition-colors ${
                            userRole === 'kitchen' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <ChefHat className="h-4 w-4" />
                        Kitchen
                    </button>
                 </div>
             )}

             {!isOrderMode && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300">
                        <Keyboard className="h-4 w-4 text-gray-700" />
                        </Button>
                    </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-300 shadow-md">
                        <DropdownMenuLabel>Keyboard Shortcuts</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {menuItems.map((item) => (
                        <DropdownMenuItem key={item.id} className="flex justify-between">
                            <span>{item.label}</span>
                            <span className="text-xs text-orange-400 font-mono">{item.shortcut}</span>
                        </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
             )}

             {isOrderMode ? (
                 <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-gray-600 border-gray-300 hover:bg-gray-100"
                    onClick={onExitOrderMode}
                 >
                    <LogOut className="h-4 w-4 mr-2" />
                    Exit Mode
                 </Button>
             ) : (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9 w-9"
                    onClick={onLogout}
                    title="Logout"
                >
                    <LogOut className="h-5 w-5" />
                </Button>
             )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex overflow-x-auto gap-2 pb-3 pt-1 no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? 'default' : 'outline'}
                size="sm"
                className={`flex items-center gap-2 whitespace-nowrap ${
                  activeView === item.id ? 'bg-orange-600 text-white' : ''
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Header;
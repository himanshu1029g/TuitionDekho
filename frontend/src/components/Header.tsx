
import React from 'react';
import { useState, useEffect } from 'react';
import { GraduationCap, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
/*
const Header = () => {\n  const [notifCount, setNotifCount] = React.useState(0);\n  const [notifications, setNotifications] = React.useState<any[]>([]);\n 
React.useEffect(() => {\n
    let mounted = true;\n
    (async function(){\n 
     try {\n    
    const { getNotificationsCount, getNotifications, markNotificationRead } = await import('@/lib/api');\n 
       const c = await getNotificationsCount();
\n        if (!mounted) return; setNotifCount(c.count || 0);\n
        const list = await getNotifications();
 if (!mounted) return; setNotifications(list.notifications || []);\n      }
 catch (e) { 
 console.error(e); }
 \n    })();
 \n    return () => { mounted = false; }
 \n  }, []);*/
const Header = () => {
  const [notifCount, setNotifCount] = React.useState(0);
  const [Notification, setNotification] = React.useState<any[]>([])

  React.useEffect(() => {

    let mounted = true;
    async () => {
      try {
        const { getNotificationsCount, getNotifications, markNotificationRead } = await import("@/lib/api")
        const c = await getNotificationsCount();
        if (!mounted) return; setNotifCount(c.count || 0);
        const list = await getNotifications();
        if (!mounted) return; setNotification(list.notifications || []);
      }
      catch (e) {
        console.error(e);
      }
    }
    return () => { mounted = false }

  }, []);






  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogoClick = () => {
    if (user?.role === 'student') {
      navigate('/student-dashboard');
    } else if (user?.role === 'teacher') {
      navigate('/teacher-dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 ">
          <GraduationCap
            className="h-8 w-8 text-primary cursor-pointer"
            onClick={handleLogoClick}
          />
          <h1 className="text-2xl font-bold text-primary cursor-pointer"
            onClick={() => navigate("/")}
          >TuitionDekho.com</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              2
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => {
                if (user?.role === 'student') {
                  navigate('/student-dashboard');
                } else {
                  navigate('/teacher-dashboard');
                }
              }}>
                <User className="mr-2 h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;

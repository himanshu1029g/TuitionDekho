import React, { useEffect, useState } from "react";
import { GraduationCap, Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// SocketEvents is mounted globally in App; avoid mounting twice here

const Header = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  // ✅ initial load: notifications and count
  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const {
          getNotificationsCount,
          getNotifications
        } = await import("@/lib/api");

        const c = await getNotificationsCount();
        if (!mounted) return;
        setNotifCount(c.count || 0);

        const list = await getNotifications();
        if (!mounted) return;
        setNotifications(list.notifications || []);
      } catch (e) {
        console.error("Notification error:", e);
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  // listen for socket-driven local notification increments
  useEffect(() => {
    const onLocalNotif = (e: any) => {
      const inc = e.detail?.increment || 1;
      const notif = e.detail?.notification;
      setNotifCount((c) => c + inc);
      if (notif) {
        const localId = notif._id || notif.id || `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        setNotifications((prev) => [{ ...notif, _id: localId, createdAt: Date.now() }, ...prev].slice(0, 50));
      }
    };

    window.addEventListener('notifications:changed', onLocalNotif);
    return () => window.removeEventListener('notifications:changed', onLocalNotif);
  }, []);

  const handleNotificationsOpenChange = async (openState: boolean) => {
    setOpen(openState);
    if (!openState) return;

    try {
      const { getNotifications, markNotificationRead } = await import('@/lib/api');
      const list = await getNotifications();
      setNotifications(list.notifications || []);

      // mark unread as read (best-effort) only when we have an id
      (list.notifications || []).forEach(async (n: any) => {
        const nid = n._id || n.id;
        if (!n.read && nid && !nid.toString().startsWith('local-')) {
          try { await markNotificationRead(nid); } catch (e) { /* ignore */ }
        }
      });

      setNotifCount(0);
    } catch (e) {
      console.error('notifications open error', e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleLogoClick = () => {
    if (user?.role === "student") {
      navigate("/student-dashboard");
    } else if (user?.role === "teacher") {
      navigate("/teacher-dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <>


      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <GraduationCap
              className="h-8 w-8 text-primary cursor-pointer"
              onClick={handleLogoClick}
            />
            <h1
              className="text-2xl font-bold text-primary cursor-pointer"
              onClick={() => navigate("/")}
            >
              TuitionDekho.com
            </h1>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
          <DropdownMenu open={open} onOpenChange={(v) => handleNotificationsOpenChange(v)}>
            <DropdownMenuTrigger asChild>
              <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {notifCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
              <div className="p-2">
                {notifications.length === 0 ? (
                  <div className="text-sm text-gray-500">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((n: any, i: number) => (
                    <div key={n._id || n.id || n.createdAt || i} className="p-2 rounded hover:bg-gray-100 cursor-pointer" onClick={async () => {
                      try {
                        const nid = n._id || n.id;
                        // only call server for real IDs (not synthetic local ones)
                        try {
                          if (!n.read && nid && !nid.toString().startsWith('local-')) {
                            await (await import('@/lib/api')).markNotificationRead(nid);
                          } else if (!n.read && nid && nid.toString().startsWith('local-')) {
                            // mark local notification read in UI only
                            setNotifications(prev => prev.map(p => (p._id === nid ? { ...p, read: true } : p)));
                          }
                        } catch(e) {
                          console.error(e);
                        }
                        setOpen(false);
                        // optionally navigate depending on n.type
                      } catch (e) { console.error(e); }
                    }}>
                      <div className="text-sm font-medium">{n.title || (n.message || n.text) || 'Notification'}</div>
                      <div className="text-xs text-gray-500">{new Date(n.createdAt || n.timestamp || Date.now()).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() =>
                    navigate(
                      user?.role === "student"
                        ? "/student-dashboard"
                        : "/teacher-dashboard"
                    )
                  }
                >
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;

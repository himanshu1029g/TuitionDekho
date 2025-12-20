import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { setAuthToken } from "../lib/http";
import LoginModal from "@/components/LoginModal";
import { socket } from "@/lib/socket";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
  avatar?: string;
}

interface CallLog {
  fromUser: { id: string; name: string };
  roomId: string;
  time: number;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  loading: boolean;

  // auth modal
  authModal: null | "student" | "teacher";
  openLoginModal: (mode?: "student" | "teacher") => void;
  closeLoginModal: () => void;

  // 🔥 CALL LOGS
  missedCalls: CallLog[];
  clearMissedCalls: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [authModal, setAuthModal] = useState<null | "student" | "teacher">(null);

  // 🔥 NEW
  const [missedCalls, setMissedCalls] = useState<CallLog[]>([]);

  const openLoginModal = (mode: "student" | "teacher" = "student") =>
    setAuthModal(mode);

  const closeLoginModal = () => setAuthModal(null);

  // ---------------- RESTORE USER ----------------
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tuitionDekho_user");
      const token = localStorage.getItem("token");

      if (token) setAuthToken(token);

      if (stored) {
        const parsed = JSON.parse(stored);
        const normalized = {
          ...(parsed || {}),
          id: parsed.id || parsed._id,
        };
        setUser(normalized as User);
      }
    } catch (e) {
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------- SOCKET JOIN ----------------
  // ---------------- SOCKET REGISTER ----------------
useEffect(() => {
  if (!user?.id) return;

  // 🔥 VERY IMPORTANT
  socket.emit("register", user.id);

  const onMissedCall = (data: CallLog) => {
    setMissedCalls(prev => [data, ...prev]);
  };

  socket.on("missed-call", onMissedCall);

  return () => {
    socket.off("missed-call", onMissedCall);
  };
}, [user]);


  // ---------------- LOGIN / LOGOUT ----------------
  // const login = (userData: User, token?: string) => {
  //   setUser(userData);
  //   localStorage.setItem("tuitionDekho_user", JSON.stringify(userData));
  //   if (token) {
  //     localStorage.setItem("token", token);
  //     setAuthToken(token);
  //   }
  // };

  const login = (userData: User, token?: string) => {
  const normalized = {
    ...userData,
    id: (userData as any).id || (userData as any)._id,
  };

  setUser(normalized);
  localStorage.setItem("tuitionDekho_user", JSON.stringify(normalized));

  if (token) {
    localStorage.setItem("token", token);
    setAuthToken(token);
  }
};


  const logout = () => {
    if (user?.id) socket.emit("leave", user.id);
    setUser(null);
    setMissedCalls([]);
    localStorage.clear();
    setAuthToken(undefined);
  };

  const clearMissedCalls = () => setMissedCalls([]);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      login,
      logout,
      loading,
      authModal,
      openLoginModal,
      closeLoginModal,
      missedCalls,
      clearMissedCalls,
    }),
    [user, loading, authModal, missedCalls]
  );

  return (
    <UserContext.Provider value={value}>
      {children}

      {authModal && (
        <LoginModal
          isOpen
          onClose={closeLoginModal}
          mode={authModal}
        />
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

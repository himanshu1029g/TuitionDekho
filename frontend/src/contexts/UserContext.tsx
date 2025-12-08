import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { setAuthToken } from "../lib/http";
import LoginModal from "@/components/LoginModal"; // ← IMPORTANT: make sure path is correct

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
  avatar?: string;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  loading: boolean;

  // NEW ↓↓↓
  authModal: null | "student" | "teacher";
  openLoginModal: (mode?: "student" | "teacher") => void;
  closeLoginModal: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // NEW — modal controls
  const [authModal, setAuthModal] = useState<null | "student" | "teacher">(null);

  const openLoginModal = (mode: "student" | "teacher" = "student") => {
    setAuthModal(mode);
  };

  const closeLoginModal = () => {
    setAuthModal(null);
  };

  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("tuitionDekho_user")
          : null;
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (token) setAuthToken(token);

      if (stored) {
        const parsed = JSON.parse(stored);
        const normalized = {
          ...(parsed || {}),
          _id: parsed._id || parsed.id,
          id: parsed.id || parsed._id,
        };
        setUser(normalized as User);
      }
    } catch (e) {
      console.error("Failed to restore user:", e);
      localStorage.removeItem("tuitionDekho_user");
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData: User, token?: string) => {
    const normalized = {
      ...userData,
      _id: (userData as any)._id || (userData as any).id,
      id: (userData as any).id || (userData as any)._id,
    } as User;

    setUser(normalized);
    localStorage.setItem("tuitionDekho_user", JSON.stringify(normalized));

    if (token) {
      localStorage.setItem("token", token);
      setAuthToken(token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("tuitionDekho_user");
    localStorage.removeItem("token");
    setAuthToken(undefined);
  };

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      login,
      logout,
      loading,

      // NEW
      authModal,
      openLoginModal,
      closeLoginModal,
    }),
    [user, loading, authModal]
  );

  return (
    <UserContext.Provider value={value}>
      {children}

      {/* 🔥 GLOBAL LOGIN MODAL HANDLER */}
      {authModal && (
        <LoginModal
          isOpen={true}
          onClose={closeLoginModal}
          mode={authModal}
        />
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};

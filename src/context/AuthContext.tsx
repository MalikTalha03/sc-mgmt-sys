import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { AppUser } from "../models/user";
import { authService, type LoginCredentials, type LoginResponse } from "../services/auth.service";

// Simplified User type to replace Firebase User
interface User {
  id: number;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

interface AuthContextType {
  currentUser: User | null;
  userData: AppUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = () => {
      if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          
          // Convert Rails user to AppUser format
          setUserData({
            uid: user.id.toString(),
            email: user.email,
            role: user.role,
            linkedId: '', // You may want to fetch this based on role
          });
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response: LoginResponse = await authService.login(credentials);
      
      // Set current user
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
      };
      
      setCurrentUser(user);
      authService.setCurrentUser(response.user);
      
      // Convert to AppUser format for compatibility
      setUserData({
        uid: response.user.id.toString(),
        email: response.user.email,
        role: response.user.role,
        linkedId: '', // You may want to fetch student_id or teacher_id based on role
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    authService.clearCurrentUser();
    setCurrentUser(null);
    setUserData(null);
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

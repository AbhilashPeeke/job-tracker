import { createContext, useContext, useState, type ReactNode } from "react";
import { api, type AuthResponse } from "./api";

interface AuthState {
  email: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [email, setEmail] = useState<string | null>(localStorage.getItem("email"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));

  const save = (res: AuthResponse) => {
    localStorage.setItem("token", res.token);
    localStorage.setItem("email", res.email);
    localStorage.setItem("role", res.role);
    setToken(res.token);
    setEmail(res.email);
    setRole(res.role);
  };

  const login = async (e: string, p: string) => {
    const res = await api.post<AuthResponse>("/Auth/login", { email: e, password: p });
    save(res.data);
  };

  const register = async (e: string, p: string) => {
    const res = await api.post<AuthResponse>("/Auth/register", { email: e, password: p });
    save(res.data);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setEmail(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ email, role, isAuthenticated: !!token, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
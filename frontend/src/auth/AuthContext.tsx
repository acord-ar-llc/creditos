import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User, RegisterRequest } from "../api/types";
import { register as apiRegister, requestOTP as apiRequestOTP, verifyOTP as apiVerifyOTP, firebaseLogin as apiFirebaseLogin } from "../api/endpoints";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (data: RegisterRequest) => Promise<void>;
  requestOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<void>;
  firebaseLogin: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthResponse = useCallback((response: { token: string; user: User }) => {
    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await apiRegister(data);
    handleAuthResponse(response);
  }, [handleAuthResponse]);

  const requestOTP = useCallback(async (email: string) => {
    await apiRequestOTP({ email, channel: "email" });
  }, []);

  const verifyOTP = useCallback(async (email: string, code: string) => {
    const response = await apiVerifyOTP({ email, code, channel: "email" });
    handleAuthResponse(response);
  }, [handleAuthResponse]);

  const firebaseLogin = useCallback(async (idToken: string) => {
    const response = await apiFirebaseLogin({ idToken });
    handleAuthResponse(response);
  }, [handleAuthResponse]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        register,
        requestOTP,
        verifyOTP,
        firebaseLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

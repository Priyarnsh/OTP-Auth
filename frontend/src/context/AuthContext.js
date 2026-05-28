"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.auth.getMe();
      setUser(res.data.user);
    } catch {
      // Not authenticated — try refreshing
      try {
        const refreshRes = await api.auth.refresh();
        setUser(refreshRes.data.user);
      } catch {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const sendOtp = useCallback(async (type, identifier) => {
    setError(null);
    const res = await api.auth.sendOtp(type, identifier);
    return res;
  }, []);

  const verifyOtp = useCallback(async (type, identifier, otp) => {
    setError(null);
    const res = await api.auth.verifyOtp(type, identifier, otp);
    setUser(res.data.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore — clear local state anyway
    }
    setUser(null);
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await api.auth.logoutAll();
    } catch {
      // Ignore
    }
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await api.auth.updateProfile(data);
    setUser(res.data.user);
    return res;
  }, []);

  const value = {
    user,
    loading,
    error,
    setError,
    isAuthenticated: !!user,
    sendOtp,
    verifyOtp,
    logout,
    logoutAll,
    updateProfile,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

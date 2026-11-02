import { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "./config";

const SESSION_STORAGE_KEY = "kidchat-session";
const AuthContext = createContext(null);

const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const readStoredSession = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY));
    if (!stored?.access_token || !stored?.user) return null;
    const expiresAt = getTokenExpiry(stored.access_token);
    if (expiresAt === null || expiresAt <= Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return stored;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  useEffect(() => {
    if (!session?.access_token) return undefined;
    const expiresAt = getTokenExpiry(session.access_token);
    if (expiresAt === null) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setSession(null);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setSession(null);
    }, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [session]);

  const loginWithGoogle = async (credential) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: credential }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Google sign-in failed");

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    setSession(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken: session?.access_token || null,
        user: session?.user || null,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

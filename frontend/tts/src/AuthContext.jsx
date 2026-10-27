import { createContext, useContext, useState } from "react";
import { API_BASE_URL } from "./config";

const SESSION_STORAGE_KEY = "kidchat-session";
const AuthContext = createContext(null);

const readStoredSession = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY));
    return stored?.access_token && stored?.user ? stored : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

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

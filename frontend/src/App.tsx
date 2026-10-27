import React, { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AppRouter from "./routes";
import { useAuthStore } from "@/store/auth-store";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function App() {
  useEffect(() => {
    const handleLogout = () => {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppRouter />
    </GoogleOAuthProvider>
  );
}

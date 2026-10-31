import React, { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import AppRouter from "./routes";
import { useAuthStore } from "@/store/auth-store";

const DEFAULT_CLIENT_ID = "971291442723-k2l3veh0365pklhsaesv087f8heohiai.apps.googleusercontent.com";
const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_ID =
  !rawClientId || rawClientId.includes("your-google-client-id") ? DEFAULT_CLIENT_ID : rawClientId;

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
      <Toaster position="top-right" richColors closeButton duration={5000} />
      <AppRouter />
    </GoogleOAuthProvider>
  );
}

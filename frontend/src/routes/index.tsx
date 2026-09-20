import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ProtectedRoute } from "./protected-route";
import AppLayout from "@/components/layout/AppLayout";

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const VerifyOtpPage = lazy(() => import("@/pages/VerifyOtpPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const CaseDashboardPage = lazy(() => import("@/pages/CaseDashboardPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const BookmarksPage = lazy(() => import("@/pages/BookmarksPage"));
const FilesPage = lazy(() => import("@/pages/FilesPage"));
const ResearchPage = lazy(() => import("@/pages/ResearchPage"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

import { SuitsLoader } from "@/components/common/SuitsLoader";
import { ErrorState } from "@/components/common/ErrorState";
import { useRouteError } from "react-router-dom";

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <SuitsLoader size={50} label="Loading…" />
    </div>
  );
}

function RouteErrorBoundary() {
  const error: any = useRouteError();
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <ErrorState
        title="Application Error"
        message={error?.message || error?.statusText || "An unexpected error occurred while rendering this page."}
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <RouteErrorBoundary />,
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={<PageLoader />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: "/verify-otp",
    element: (
      <Suspense fallback={<PageLoader />}>
        <VerifyOtpPage />
      </Suspense>
    ),
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: "/dashboard", element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
          { path: "/search", element: <Suspense fallback={<PageLoader />}><SearchPage /></Suspense> },
          { path: "/case/:cnr", element: <Suspense fallback={<PageLoader />}><CaseDashboardPage /></Suspense> },
          { path: "/chat", element: <Suspense fallback={<PageLoader />}><ChatPage /></Suspense> },
          { path: "/chat/:conversationId", element: <Suspense fallback={<PageLoader />}><ChatPage /></Suspense> },
          { path: "/bookmarks", element: <Suspense fallback={<PageLoader />}><BookmarksPage /></Suspense> },
          { path: "/files", element: <Suspense fallback={<PageLoader />}><FilesPage /></Suspense> },
          { path: "/research", element: <Suspense fallback={<PageLoader />}><ResearchPage /></Suspense> },
          { path: "/history", element: <Suspense fallback={<PageLoader />}><HistoryPage /></Suspense> },
          { path: "/analytics", element: <Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense> },
          { path: "/profile", element: <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense> },
          { path: "/settings", element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}

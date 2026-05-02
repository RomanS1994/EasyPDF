import { createBrowserRouter, Navigate } from "react-router-dom";
import React from "react";
import { App } from "./App.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute.jsx";
import { RouterError } from "./components/RouterError/RouterError.jsx";
import { AccountPage } from "../pages/AccountPage/AccountPage.jsx";
import { AdminAccountsPage } from "../pages/AdminAccountsPage/AdminAccountsPage.jsx";
import { AdminAuditPage } from "../pages/AdminAuditPage/AdminAuditPage.jsx";
import { AdminLanguagePage } from "../pages/AdminLanguagePage/AdminLanguagePage.jsx";
import { AdminOrdersPage } from "../pages/AdminOrdersPage/AdminOrdersPage.jsx";
import { AdminPage } from "../pages/AdminPage/AdminPage.jsx";
import { AdminPlansPage } from "../pages/AdminPlansPage/AdminPlansPage.jsx";
import { AdminSettingsPage } from "../pages/AdminSettingsPage/AdminSettingsPage.jsx";
import { AdminSubscriptionsPage } from "../pages/AdminSubscriptionsPage/AdminSubscriptionsPage.jsx";
import { HomePage } from "../pages/HomePage/HomePage.jsx";
import { HistoryDisplayPage } from "../pages/HistoryDisplayPage/HistoryDisplayPage.jsx";
import { HistoryPage } from "../pages/HistoryPage/HistoryPage.jsx";
import { ManagerPage } from "../pages/ManagerPage/ManagerPage.jsx";
import { OrdersPage } from "../pages/OrdersPage/OrdersPage.jsx";
import { SettingsPage } from "../pages/SettingsPage/SettingsPage.jsx";
import { SignInPage } from "../pages/SignInPage/SignInPage.jsx";
import { StatsPage } from "../pages/StatsPage/StatsPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/cz/pdf" replace />,
  },
  {
    element: <App />,
    errorElement: <RouterError />,
    children: [
      {
        path: "/cz/pdf",
        element: <HomePage />,
      },
      {
        path: "/cz/pdf/sign-in",
        element: <SignInPage />,
      },
      {
        path: "/cz/pdf/orders",
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/account",
        element: <AccountPage />,
      },
      {
        path: "/cz/pdf/settings",
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/stats",
        element: (
          <ProtectedRoute>
            <StatsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/history",
        element: (
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/history/display/:orderId",
        element: (
          <ProtectedRoute>
            <HistoryDisplayPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/manager",
        element: (
          <ProtectedRoute requireManager>
            <ManagerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/admin",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/admin/accounts",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminAccountsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/admin/subscriptions",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminSubscriptionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/admin/orders",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminOrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/admin/settings",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/admin/settings/language",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminLanguagePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/admin/settings/plans",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminPlansPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/cz/pdf/admin/settings/audit",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminAuditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/cz/pdf" replace />,
      },
    ],
  },
]);

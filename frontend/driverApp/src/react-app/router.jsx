import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { App } from '@shared/app/App.jsx';
import { ProtectedRoute } from '@shared/app/components/ProtectedRoute/ProtectedRoute.jsx';
import { RouterError } from '@shared/app/components/RouterError/RouterError.jsx';
import { AccountPage } from './pages/AccountPage/AccountPage.jsx';
import { BusinessProfilePage } from './pages/BusinessProfilePage/BusinessProfilePage.jsx';
import { HomePage } from './pages/HomePage/HomePage.jsx';
import { AvailableOrdersPage } from './pages/AvailableOrdersPage/AvailableOrdersPage.jsx';
import { HistoryDisplayPage } from './pages/HistoryDisplayPage/HistoryDisplayPage.jsx';
import { HistoryPage } from './pages/HistoryPage/HistoryPage.jsx';
import { OrdersPage } from './pages/OrdersPage/OrdersPage.jsx';
import { PlanUpgradePage } from './pages/PlanUpgradePage/PlanUpgradePage.jsx';
import { SettingsPage } from './pages/SettingsPage/SettingsPage.jsx';
import { SignInPage } from './pages/SignInPage/SignInPage.jsx';
import { StatsPage } from './pages/StatsPage/StatsPage.jsx';

export const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <RouterError />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'sign-in',
        element: <SignInPage />,
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'available-orders',
        element: (
          <ProtectedRoute>
            <AvailableOrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'account',
        element: <AccountPage />,
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/business-profile',
        element: (
          <ProtectedRoute>
            <BusinessProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/plan-upgrade',
        element: (
          <ProtectedRoute>
            <PlanUpgradePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'stats',
        element: (
          <ProtectedRoute>
            <StatsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'history',
        element: (
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'history/display/:orderId',
        element: (
          <ProtectedRoute>
            <HistoryDisplayPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <Navigate to='/' replace />,
      },
    ],
  },
]);

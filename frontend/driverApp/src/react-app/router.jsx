import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { App } from '@shared/app/App.jsx';
import { ProtectedRoute } from '@shared/app/components/ProtectedRoute/ProtectedRoute.jsx';
import { RouterError } from '@shared/app/components/RouterError/RouterError.jsx';
import { AccountPage } from './pages/AccountPage/AccountPage.jsx';
import { BusinessProfilePage } from './pages/BusinessProfilePage/BusinessProfilePage.jsx';
import { FlightTrackingPage } from './pages/FlightTrackingPage/FlightTrackingPage.jsx';
import { HomePage } from './pages/HomePage/HomePage.jsx';
import { AvailableOrdersPage } from './pages/AvailableOrdersPage/AvailableOrdersPage.jsx';
import { CalendarPage } from './pages/CalendarPage/CalendarPage.jsx';
import { HistoryDisplayPage } from './pages/HistoryDisplayPage/HistoryDisplayPage.jsx';
import { HistoryPage } from './pages/HistoryPage/HistoryPage.jsx';
import { LanguagePage } from './pages/LanguagePage/LanguagePage.jsx';
import { OrdersPage } from './pages/OrdersPage/OrdersPage.jsx';
import {
  OrderDispatchDriverPage,
  OrderDispatchPage,
  OrderDispatchTeamPage,
} from './pages/OrderDispatchPage/OrderDispatchPage.jsx';
import { PlanUpgradePage } from './pages/PlanUpgradePage/PlanUpgradePage.jsx';
import { ProvidersInfoPage } from './pages/ProvidersInfoPage/ProvidersInfoPage.jsx';
import { ProvidersPage } from './pages/ProvidersPage/ProvidersPage.jsx';
import { SettingsPage } from './pages/SettingsPage/SettingsPage.jsx';
import { SignInPage } from './pages/SignInPage/SignInPage.jsx';
import { StatsPage } from './pages/StatsPage/StatsPage.jsx';
import { TaxInfoFilePage } from './pages/TaxInfoFilePage/TaxInfoFilePage.jsx';
import { TaxInfoPage } from './pages/TaxInfoPage/TaxInfoPage.jsx';
import { TeamCollaborationPage } from './pages/TeamCollaborationPage/TeamCollaborationPage.jsx';
import { TeamPage, TeamSearchPage } from './pages/TeamPage/TeamPage.jsx';

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
        path: 'orders/:orderId/dispatch',
        element: (
          <ProtectedRoute>
            <OrderDispatchPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:orderId/dispatch/team',
        element: (
          <ProtectedRoute requirePlatinumTeam>
            <OrderDispatchTeamPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:orderId/dispatch/driver',
        element: (
          <ProtectedRoute>
            <OrderDispatchDriverPage />
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
        path: 'calendar',
        element: (
          <ProtectedRoute>
            <CalendarPage />
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
        path: 'settings/providers',
        element: (
          <ProtectedRoute>
            <ProvidersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/language',
        element: (
          <ProtectedRoute>
            <LanguagePage />
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
        path: 'settings/tax-info',
        element: (
          <ProtectedRoute>
            <TaxInfoPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/tax-info/pdf',
        element: (
          <ProtectedRoute>
            <TaxInfoFilePage reportType="pdf" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/tax-info/excel',
        element: (
          <ProtectedRoute>
            <TaxInfoFilePage reportType="excel" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/tax-info/accountant',
        element: (
          <ProtectedRoute>
            <TaxInfoFilePage reportType="accountant" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'flight-tracking',
        element: (
          <ProtectedRoute>
            <FlightTrackingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'team-collaboration',
        element: (
          <ProtectedRoute>
            <TeamCollaborationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'providers-info',
        element: (
          <ProtectedRoute>
            <ProvidersInfoPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/team',
        element: (
          <ProtectedRoute requirePlatinumTeam>
            <TeamPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/team/search',
        element: (
          <ProtectedRoute requirePlatinumTeam>
            <TeamSearchPage />
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

import { Outlet } from 'react-router-dom';

import { AppLayout } from './layouts/AppLayout/AppLayout.jsx';
import './App.css';

export function App() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';

import { router } from '../router.jsx';
import { store } from '../store.js';
import { useAuthSession } from '../../features/auth/useAuthSession.js';

import './AppProviders.css';

function AuthSessionBootstrap() {
  useAuthSession();
  return null;
}

export function AppProviders() {
  return (
    <div className="reactAppProviders">
      <Provider store={store}>
        <AuthSessionBootstrap />
        <RouterProvider router={router} />
      </Provider>
    </div>
  );
}

import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import React from "react";
import { router } from "../router.jsx";
import { store } from "../store.js";
import { useAuthSession } from "../../features/auth/useAuthSession.js";

import "../theme.css";
import "./AppProviders.css";

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

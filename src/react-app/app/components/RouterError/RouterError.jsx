import React from "react";

import { Link, useRouteError } from "react-router-dom";

import "./RouterError.css";

export function RouterError() {
  const error = useRouteError();
  const message =
    error instanceof Error ? error.message : "The page failed to load.";

  return (
    <section className="routerError">
      <h1 className="routerError-title">Page failed to load</h1>
      <p className="routerError-message">{message}</p>
      <Link className="routerError-link" to="/cz/pdf">
        Go to home
      </Link>
    </section>
  );
}

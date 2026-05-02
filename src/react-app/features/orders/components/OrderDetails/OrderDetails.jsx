import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { selectUser } from "../../../../features/auth/authSlice.js";
import { hasManagerAccess } from "../../../../features/auth/authAccess.js";
import { useGenerateContractPdfMutation } from "../../../contract/contractApi.js";
import { downloadFile } from "../../../contract/utils/downloadFile.js";
import { useGetManagerUsersQuery } from "../../../manager/managerApi.js";
import {
  useArchiveOrderMutation,
  useAssignDriverMutation,
  useGetOrderQuery,
  useUpdateOrderMutation,
} from "../../ordersApi.js";
import { resolveErrorMessage } from "../../../../app/utils/errorMessages.js";
import "./OrderDetails.css";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getLocation(value) {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.address || value.name || value.label || "-";
}

function getTransferLabel(user) {
  if (!user) {
    return "-";
  }

  return `${user.name || "-"} · ${user.email || "-"}`;
}

export function OrderDetails({ orderId, onClose }) {
  const currentUser = useSelector(selectUser);
  const canTransfer = hasManagerAccess(currentUser?.role);
  const [isClosing, setIsClosing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [archiveOrder, { isLoading: isArchiving }] = useArchiveOrderMutation();
  const [assignDriver, { isLoading: isTransferring }] =
    useAssignDriverMutation();
  const [updateOrder] = useUpdateOrderMutation();
  const [generateContractPdf, { isLoading: isGenerating }] =
    useGenerateContractPdfMutation();
  const { data, isLoading, isError } = useGetOrderQuery(orderId, {
    skip: !orderId,
  });
  const { data: managerUsersData, isFetching: isUsersFetching } =
    useGetManagerUsersQuery(
      {
        search: transferSearch,
        role: "all",
        status: "all",
        planId: "all",
      },
      {
        skip: !orderId || !showTransfer || !canTransfer,
      },
    );

  const order = data?.order || data || {};
  const customer = order?.contractData?.customer || order?.customer || {};
  const trip = order?.contractData?.trip || order?.trip || {};
  const orderOwner = order?.user || {};
  const orderOwnerId = String(orderOwner?.id || order.userId || "");
  const managerUsers = managerUsersData?.users || [];
  const transferUsers = useMemo(() => {
    return managerUsers.filter((user) => user?.role !== "admin");
  }, [managerUsers]);
  const selectedTransferUser = transferUsers.find(
    (user) => user.id === selectedUserId,
  );

  useEffect(() => {
    if (!orderId) {
      return;
    }

    setIsClosing(false);
    setMessage("");
    setError("");
    setShowTransfer(false);
    setTransferSearch("");
    setSelectedUserId("");
  }, [orderId]);

  useEffect(() => {
    if (!isClosing) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onClose();
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isClosing, onClose]);

  useEffect(() => {
    if (!orderId) {
      return undefined;
    }

    const body = document.body;
    body.classList.add("no-scroll");

    function handleKeyDown(event) {
      if (
        event.key === "Escape" &&
        !isArchiving &&
        !isTransferring &&
        !isGenerating
      ) {
        if (showTransfer) {
          setShowTransfer(false);
          return;
        }

        setIsClosing(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      body.classList.remove("no-scroll");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    orderId,
    showTransfer,
    isArchiving,
    isTransferring,
    isGenerating,
    onClose,
  ]);

  async function handleArchive() {
    setMessage("");
    setError("");

    if (!window.confirm("Archive this order?")) {
      return;
    }

    try {
      await archiveOrder(orderId).unwrap();
      setMessage("Order archived.");
      onClose();
    } catch (error) {
      setError(resolveErrorMessage(error, "Failed to archive order."));
    }
  }

  async function handleDownloadPdf(documentType) {
    setMessage("");
    setError("");

    try {
      const blob = await generateContractPdf({
        orderId,
        documentType,
        contractData: order.contractData || {},
      }).unwrap();

      const safeNumber = String(order.orderNumber || orderId).replace(
        /[^a-z0-9_-]+/gi,
        "-",
      );
      downloadFile(blob, `${safeNumber}-${documentType}.pdf`);
      setMessage(`${documentType} PDF downloaded.`);

      try {
        await updateOrder({
          orderId,
          payload: {
            status: "pdf_generated",
            metadata: {
              documentType,
            },
            pdf: {
              documentType,
            },
          },
        }).unwrap();
      } catch (updateError) {
        console.error(
          "Failed to update order status after PDF download:",
          updateError,
        );
      }
    } catch (error) {
      setError(
        resolveErrorMessage(error, `Failed to generate ${documentType} PDF.`),
      );
    }
  }

  async function handleTransfer() {
    setMessage("");
    setError("");

    if (!selectedUserId) {
      setError("Select a driver first.");
      return;
    }

    try {
      const response = await assignDriver({
        orderId,
        userId: selectedUserId,
      }).unwrap();

      setMessage(
        `Transferred to ${response?.order?.user?.name || selectedTransferUser?.name || "driver"}.`,
      );
      setShowTransfer(false);
      setSelectedUserId("");
    } catch (error) {
      setError(resolveErrorMessage(error, "Failed to transfer order."));
    }
  }

  function handleCloseRequest() {
    if (showTransfer) {
      setShowTransfer(false);
      return;
    }

    setIsClosing(true);
  }

  function handleBackdropClick(event) {
    if (event.target !== event.currentTarget) {
      return;
    }

    handleCloseRequest();
  }

  if (!orderId) {
    return null;
  }

  return (
    <section
      className={`orderDrawer ${isClosing ? "is-closing" : "is-open"}`}
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        className="orderDrawer-backdrop"
        aria-hidden="true"
        onClick={handleBackdropClick}
      />
      <div
        className="orderDrawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orderWindowTitle"
      >
        <div className="orderDrawer-header">
          <button
            className="orderDrawer-backBtn"
            type="button"
            onClick={handleCloseRequest}
            aria-label="Back"
          >
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </button>
        </div>

        {message ? <p className="orderWindow-message">{message}</p> : null}
        {error ? <p className="orderWindow-error">{error}</p> : null}

        {isLoading ? (
          <p className="orderWindow-state">Loading order...</p>
        ) : null}
        {isError ? (
          <p className="orderWindow-state">Failed to load order.</p>
        ) : null}

        {!isLoading && !isError ? (
          <>
            <div className="orderDrawer-section">
              <h4 className="orderDrawer-sectionTitle">Order information</h4>
              <div className="orderDrawer-rows">
                <div className="orderDrawer-row orderDrawer-row--featured">
                  <span className="orderWindow-label">Order id</span>
                  <span className="orderWindow-value">
                    {order.orderNumber || "-"}
                  </span>
                </div>
                <div className="orderDrawer-row">
                  <span className="orderWindow-label">Status</span>
                  <span className="orderWindow-value">
                    {order.status || "-"}
                  </span>
                </div>
                <div className="orderDrawer-row">
                  <span className="orderWindow-label">Customer</span>
                  <span className="orderWindow-value">
                    {customer.name || "-"}
                  </span>
                </div>
                <div className="orderDrawer-row">
                  <span className="orderWindow-label">Customer email</span>
                  <span className="orderWindow-value">
                    {customer.email || "-"}
                  </span>
                </div>
                <div className="orderDrawer-row">
                  <span className="orderWindow-label">Created</span>
                  <span className="orderWindow-value">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="orderDrawer-section">
              <h4 className="orderDrawer-sectionTitle">Trip information</h4>
              <div className="orderDrawer-rows">
                <div className="orderDrawer-row">
                  <span className="orderWindow-label">From</span>
                  <span className="orderWindow-value">
                    {getLocation(trip.from)}
                  </span>
                </div>
                <div className="orderDrawer-row">
                  <span className="orderWindow-label">To</span>
                  <span className="orderWindow-value">
                    {getLocation(trip.to)}
                  </span>
                </div>
                <div className="orderDrawer-row">
                  <span className="orderWindow-label">Trip time</span>
                  <span className="orderWindow-value">{trip.time || "-"}</span>
                </div>
                <div className="orderDrawer-row">
                  <span className="orderWindow-label">Payment</span>
                  <span className="orderWindow-value">
                    {trip.paymentMethod || "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="orderDrawer-section">
              <h4 className="orderDrawer-sectionTitle">Document details</h4>
              <div className="orderDrawer-rows">
                <div className="orderDrawer-row">
                  <span className="orderWindow-label">Price</span>
                  <span className="orderWindow-value">
                    {order.totalPrice || "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="orderDrawer-actions orderDrawer-actions--doc">
              <button
                className="orderWindow-button orderWindow-button--doc"
                type="button"
                onClick={() => handleDownloadPdf("offer")}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Contract"}
              </button>
              <button
                className="orderWindow-button orderWindow-button--doc"
                type="button"
                onClick={() => handleDownloadPdf("confirmation")}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Invoice"}
              </button>
            </div>

            <div className="orderDrawer-actions orderDrawer-actions--stacked">
              <button
                className="orderWindow-button orderWindow-button--accent"
                type="button"
                onClick={handleArchive}
                disabled={isArchiving}
              >
                {isArchiving ? "Archiving..." : "Archive order"}
              </button>
              {canTransfer ? (
                <button
                  className="orderWindow-button orderWindow-button--transfer"
                  type="button"
                  onClick={() => setShowTransfer(true)}
                >
                  Transfer order
                </button>
              ) : null}
              <button
                className="orderWindow-button"
                type="button"
                onClick={handleCloseRequest}
              >
                Close
              </button>
            </div>

            {showTransfer ? (
              <section className="orderDrawer-transfer">
                <div className="orderDrawer-sectionTitleRow">
                  <h4 className="orderDrawer-sectionTitle">
                    Transfer to another driver
                  </h4>
                  <p className="orderDrawer-transferCopy">
                    Choose a driver or manager and confirm the reassignment.
                  </p>
                </div>

                <div className="orderDrawer-transferControls">
                  <label className="orderWindow-field">
                    <span>Search</span>
                    <input
                      type="text"
                      value={transferSearch}
                      onChange={(event) =>
                        setTransferSearch(event.target.value)
                      }
                      placeholder="Search by name or email"
                    />
                  </label>
                  <button
                    className="orderWindow-button orderWindow-button--secondary"
                    type="button"
                    onClick={() => setTransferSearch("")}
                    disabled={!transferSearch || isUsersFetching}
                  >
                    Reset
                  </button>
                </div>

                {isUsersFetching ? (
                  <p className="orderWindow-state">Loading drivers...</p>
                ) : null}

                {!isUsersFetching && transferUsers.length ? (
                  <ul className="orderWindow-userList">
                    {transferUsers.map((user) => {
                      const isActive = selectedUserId === user.id;
                      const isCurrentOwner = Boolean(
                        orderOwnerId && String(user.id) === orderOwnerId,
                      );

                      return (
                        <li key={user.id}>
                          <button
                            className={`orderWindow-userButton ${isActive ? "is-active" : ""}`}
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                            disabled={isCurrentOwner}
                          >
                            <span className="orderWindow-userName">
                              {user.name || "No name"}
                            </span>
                            <span className="orderWindow-userMeta">
                              {isCurrentOwner
                                ? "Current driver"
                                : getTransferLabel(user)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                {!isUsersFetching && !transferUsers.length ? (
                  <p className="orderWindow-state">No drivers found.</p>
                ) : null}

                {selectedTransferUser ? (
                  <div className="orderDrawer-selected">
                    <p className="orderWindow-label">Selected driver</p>
                    <strong>{getTransferLabel(selectedTransferUser)}</strong>
                  </div>
                ) : null}

                <div className="orderDrawer-actions orderDrawer-actions--transfer">
                  <button
                    className="orderWindow-button orderWindow-button--accent"
                    type="button"
                    onClick={handleTransfer}
                    disabled={isTransferring || !selectedUserId}
                  >
                    {isTransferring ? "Transferring..." : "Confirm transfer"}
                  </button>
                  <button
                    className="orderWindow-button"
                    type="button"
                    onClick={() => setShowTransfer(false)}
                  >
                    Back
                  </button>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

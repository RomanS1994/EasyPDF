import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { BackButton } from "@shared/app/components/BackButton/BackButton.jsx";
import { RequestLoader, RequestLoadingState } from "@shared/app/components/RequestLoader/RequestLoader.jsx";
import { useI18n } from "@shared/app/i18n/useI18n.js";
import { selectUser } from "@shared/features/auth/authSlice.js";
import { hasManagerAccess } from "@shared/features/auth/authAccess.js";
import { useGenerateContractPdfMutation } from "../../../contract/contractApi.js";
import { downloadFile } from "../../../contract/utils/downloadFile.js";
import {
  detectCurrency,
  extractNumericPrice,
  formatPrice,
  sanitizePriceInput,
  setCurrentCurrency,
} from "../../../contract/utils/priceUtils.js";
import { useGetAdminUsersQuery } from "@shared/features/admin/adminApi.js";
import { SvgIcon } from "@shared/app/components/SvgIcon/SvgIcon.jsx";
import {
  useAssignDriverMutation,
  useGetOrderQuery,
  useUpdateOrderMutation,
} from "../../ordersApi.js";
import { formatDateTime, getOrderTripTime } from "../../../../pages/HistoryPage/historyUtils.js";
import { resolveErrorMessage } from "@shared/app/utils/errorMessages.js";
import "./OrderDetails.css";

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

function getCommissionValue(order) {
  return String(order?.metadata?.commission ?? order?.contractData?.commission ?? "").trim();
}

function normalizeFlightNumber(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeCount(value) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function OrderGlyph({ name }) {
  return <SvgIcon name={name} />;
}

function OrderCardIcon({ name, tone = "neutral", className = "" }) {
  return (
    <span className={`orderSheetIcon orderSheetIcon--${tone} ${className}`.trim()}>
      <OrderGlyph name={name} />
    </span>
  );
}

export function OrderDetails({ orderId, onClose }) {
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const { t } = useI18n();
  const canTransfer = hasManagerAccess(currentUser?.role);
  const [isClosing, setIsClosing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [commissionInput, setCommissionInput] = useState("");
  const [commissionCurrency, setCommissionCurrency] = useState("EUR");
  const [commissionEditorOpen, setCommissionEditorOpen] = useState(false);
  const [priceEditorOpen, setPriceEditorOpen] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("EUR");
  const [flightNumberEditorOpen, setFlightNumberEditorOpen] = useState(false);
  const [flightNumberInput, setFlightNumberInput] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignDriver, { isLoading: isTransferring }] =
    useAssignDriverMutation();
  const [updateOrder, { isLoading: isUpdatingOrder }] = useUpdateOrderMutation();
  const [generateContractPdf, { isLoading: isGenerating }] =
    useGenerateContractPdfMutation();
  const { data, isLoading, isError } = useGetOrderQuery(orderId, {
    skip: !orderId,
  });
  const { data: adminUsersData, isFetching: isUsersFetching } =
    useGetAdminUsersQuery(
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
  const passengersCount = normalizeCount(order?.contractData?.passengers || order?.passengers);
  const luggageUnits = normalizeCount(
    trip?.luggageUnits ||
      order?.contractData?.luggageUnits ||
      order?.luggageUnits ||
      '',
  );
  const driverComment = String(
    trip?.driverComment ||
      order?.contractData?.driverComment ||
      order?.driverComment ||
      '',
  ).trim();
  const tripTime = formatDateTime(getOrderTripTime(order));
  const storedCommission = getCommissionValue(order);
  const storedPrice = String(order?.totalPrice || order?.contractData?.totalPrice || "").trim();
  const storedFlightNumber = String(
    order?.flightNumber || order?.contractData?.flightNumber || "",
  ).trim();
  const amountDue = storedPrice || "-";
  const commissionConverted = useMemo(() => {
    if (!commissionInput) {
      return "";
    }

    return formatPrice(commissionInput, commissionCurrency);
  }, [commissionCurrency, commissionInput]);
  const orderOwner = order?.user || {};
  const orderOwnerId = String(orderOwner?.id || order.userId || "");
  const adminUsers = adminUsersData?.users || [];
  const transferUsers = useMemo(() => {
    return adminUsers.filter((user) => user?.role !== "admin");
  }, [adminUsers]);
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
    setCommissionEditorOpen(false);
    setPriceEditorOpen(false);
    setFlightNumberEditorOpen(false);
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const currentValue = String(storedCommission || "").trim();
    const nextCurrency = detectCurrency(currentValue);
    const nextInput = extractNumericPrice(currentValue);

    setCommissionCurrency(nextCurrency);
    setCurrentCurrency(nextCurrency);
    setCommissionInput(nextInput);
  }, [orderId, storedCommission]);

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
        !isTransferring &&
        !isGenerating &&
        !isUpdatingOrder
      ) {
        if (commissionEditorOpen) {
          setCommissionEditorOpen(false);
          return;
        }

        if (priceEditorOpen) {
          setPriceEditorOpen(false);
          return;
        }

        if (flightNumberEditorOpen) {
          setFlightNumberEditorOpen(false);
          return;
        }

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
    isTransferring,
    isGenerating,
    isUpdatingOrder,
    commissionEditorOpen,
    priceEditorOpen,
    flightNumberEditorOpen,
    onClose,
  ]);

  async function handleDelete() {
    setMessage("");
    setError("");
    navigate(`/orders/${orderId}/dispatch`);
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
      setMessage(t('contract.pdfDownloaded'));

      try {
        await updateOrder({
          orderId,
          skipInvalidation: true,
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
        resolveErrorMessage(error, t('contract.failedGeneratePdf')),
      );
    }
  }

  function handleOpenDisplay() {
    navigate(`/history/display/${orderId}`);
  }

  async function handleTransfer() {
    setMessage("");
    setError("");

    if (!selectedUserId) {
      setError(t('contract.selectDriverFirst'));
      return;
    }

    try {
      const response = await assignDriver({
        orderId,
        userId: selectedUserId,
      }).unwrap();

      setMessage(
        t('contract.transferredTo', {
          name: response?.order?.user?.name || selectedTransferUser?.name || t('common.unknownUser'),
        }),
      );
      setShowTransfer(false);
      setSelectedUserId("");
    } catch (error) {
      setError(resolveErrorMessage(error, t('contract.failedToTransferOrder')));
    }
  }

  async function saveCommission(nextValue = commissionInput, nextCurrency = commissionCurrency) {
    const formatted = formatPrice(nextValue, nextCurrency);
    const normalized = formatted || sanitizePriceInput(nextValue);

    if (normalized === storedCommission) {
      setCommissionInput(extractNumericPrice(storedCommission));
      return true;
    }

    setMessage("");
    setError("");

    try {
      await updateOrder({
        orderId,
        payload: {
          metadata: {
            ...(order.metadata || {}),
            commission: normalized,
          },
        },
      }).unwrap();

      setCommissionInput(extractNumericPrice(normalized));
      setMessage(normalized ? t('contract.commissionSaved') : t('contract.commissionCleared'));
      return true;
    } catch (error) {
      setError(resolveErrorMessage(error, t('contract.failedToSaveCommission')));
      setCommissionInput(extractNumericPrice(storedCommission));
      return false;
    }
  }

  async function handleSaveCommission() {
    const saved = await saveCommission();

    if (saved) {
      closeCommissionEditor();
    }
  }

  function handleCommissionInputChange(event) {
    const nextInput = sanitizePriceInput(event.target.value);
    setCommissionInput(nextInput);
  }

  function openCommissionEditor() {
    const currentValue = String(storedCommission || "").trim();
    const nextCurrency = detectCurrency(currentValue);
    const nextInput = extractNumericPrice(currentValue);

    setError("");
    setMessage("");
    setCommissionCurrency(nextCurrency);
    setCurrentCurrency(nextCurrency);
    setCommissionInput(nextInput);
    setCommissionEditorOpen(true);
  }

  function closeCommissionEditor() {
    setCommissionEditorOpen(false);
  }

  function handleCommissionCurrencyChange(nextCurrency) {
    if (nextCurrency === commissionCurrency) {
      return;
    }

    setCurrentCurrency(nextCurrency);
    setCommissionCurrency(nextCurrency);
  }

  function clearCommission() {
    setCommissionInput("");
    setCommissionCurrency("EUR");
    setCurrentCurrency("EUR");
  }

  function openPriceEditor() {
    const currentValue = String(storedPrice || "").trim();
    const nextCurrency = detectCurrency(currentValue);
    const nextInput = extractNumericPrice(currentValue);

    setError("");
    setMessage("");
    setPriceCurrency(nextCurrency);
    setCurrentCurrency(nextCurrency);
    setPriceInput(nextInput);
    setPriceEditorOpen(true);
  }

  function closePriceEditor() {
    setPriceEditorOpen(false);
  }

  function openFlightNumberEditor() {
    setError("");
    setMessage("");
    setFlightNumberInput(normalizeFlightNumber(storedFlightNumber));
    setFlightNumberEditorOpen(true);
  }

  function closeFlightNumberEditor() {
    setFlightNumberEditorOpen(false);
  }

  function handleFlightNumberInputChange(event) {
    setFlightNumberInput(normalizeFlightNumber(event.target.value));
  }

  async function saveFlightNumber() {
    const normalized = normalizeFlightNumber(flightNumberInput);

    if (normalized === storedFlightNumber) {
      closeFlightNumberEditor();
      return;
    }

    setMessage("");
    setError("");

    try {
      await updateOrder({
        orderId,
        payload: {
          flightNumber: normalized,
          contractData: {
            ...(order.contractData || {}),
            flightNumber: normalized,
          },
        },
      }).unwrap();

      closeFlightNumberEditor();
      setMessage(t('contract.flightNumberUpdated'));
    } catch (updateError) {
      setError(resolveErrorMessage(updateError, t('contract.failedToUpdateFlightNumber')));
    }
  }

  function handlePriceInputChange(event) {
    setPriceInput(sanitizePriceInput(event.target.value));
  }

  function handlePriceCurrencyChange(nextCurrency) {
    if (nextCurrency === priceCurrency) {
      return;
    }

    setCurrentCurrency(nextCurrency);
    setPriceCurrency(nextCurrency);
  }

  async function savePrice() {
    const formatted = formatPrice(priceInput, priceCurrency);
    const normalized = formatted || sanitizePriceInput(priceInput);

    if (!normalized) {
      setError(t('contract.failedToUpdatePrice'));
      return;
    }

    if (normalized === storedPrice) {
      closePriceEditor();
      return;
    }

    setMessage("");
    setError("");

    try {
      await updateOrder({
        orderId,
        payload: {
          totalPrice: normalized,
          contractData: {
            ...(order.contractData || {}),
            totalPrice: normalized,
          },
        },
      }).unwrap();

      closePriceEditor();
      setMessage(t('contract.priceUpdated'));
    } catch (updateError) {
      setError(resolveErrorMessage(updateError, t('contract.failedToUpdatePrice')));
    }
  }

  function handleCloseRequest() {
    if (commissionEditorOpen) {
      setCommissionEditorOpen(false);
      return;
    }

    if (priceEditorOpen) {
      setPriceEditorOpen(false);
      return;
    }

    if (flightNumberEditorOpen) {
      setFlightNumberEditorOpen(false);
      return;
    }

    if (showTransfer) {
      setShowTransfer(false);
      return;
    }

    setIsClosing(true);
  }

  async function handleSaveAndClose() {
    const saved = await saveCommission();

    if (saved) {
      handleCloseRequest();
    }
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
        aria-label={t('contract.currentOrder')}
      >
        <div className="orderDrawer-header">
          <BackButton label={t('common.back')} onClick={handleCloseRequest} />
        </div>

        {message ? <p className="orderWindow-message">{message}</p> : null}
        {error ? <p className="orderWindow-error">{error}</p> : null}

        {isLoading ? (
          <RequestLoadingState className="orderWindow-state" label={t('manager.loadingOrder')} />
        ) : null}
        {isError ? (
          <p className="orderWindow-state">{t('contract.failedLoadOrder')}</p>
        ) : null}

        {!isLoading && !isError ? (
          <>
            <section className="orderSheetCard">
              <div className="orderSheetSectionHeader">
                <OrderCardIcon name="file" tone="accent" />
                <h4 className="orderSheetSectionTitle">{t('contract.orderInfo')}</h4>
              </div>

              <div className="orderSheetRows">
                <div className="orderSheetInfoRow">
                  <div className="orderSheetInfoLead">
                    <OrderCardIcon name="hash" />
                    <span className="orderSheetInfoLabel">{t('contract.orderId')}</span>
                  </div>
                  <span className="orderSheetInfoValue">{order.orderNumber || "-"}</span>
                </div>

                <div className="orderSheetInfoRow">
                  <div className="orderSheetInfoLead">
                    <OrderCardIcon name="takeoff" />
                    <span className="orderSheetInfoLabel">{t('contract.flightNumber')}</span>
                  </div>
                  <div className="orderSheetPriceValue orderSheetPriceValue--flight">
                    <span className="orderSheetInfoValue">{storedFlightNumber || "-"}</span>
                    <button
                      className="orderSheetEditButton"
                      type="button"
                      onClick={openFlightNumberEditor}
                      aria-label={t('contract.editFlightNumber')}
                    >
                      <OrderGlyph name="edit" />
                    </button>
                  </div>
                </div>

                <div className="orderSheetInfoRow">
                  <div className="orderSheetInfoLead">
                    <OrderCardIcon name="user" />
                    <span className="orderSheetInfoLabel">{t('contract.customer')}</span>
                  </div>
                  <div className="orderSheetValueAction">
                    <span className="orderSheetInfoValue">{customer.name || "-"}</span>
                    <button
                      className="orderSheetDisplayButton"
                      type="button"
                      onClick={handleOpenDisplay}
                      aria-label={`${t('history.openDisplay')} ${customer.name || t('common.noName')}`}
                      title={t('history.openDisplay')}
                    >
                      <SvgIcon name="monitor" />
                    </button>
                  </div>
                </div>

                <div className="orderSheetInfoRow">
                  <div className="orderSheetInfoLead">
                    <OrderCardIcon name="mail" />
                    <span className="orderSheetInfoLabel">{t('contract.customerData')}</span>
                  </div>
                  <span className="orderSheetInfoValue">{customer.phone || customer.email || "-"}</span>
                </div>

                <div
                  className="orderSheetInfoRow orderSheetInfoRow--compactStats"
                  aria-label={`${t('contract.passengers')}: ${passengersCount}. ${t('contract.luggageUnits')}: ${luggageUnits}.`}
                >
                  <span className="orderSheetCompactStat">
                    <OrderCardIcon name="accounts" />
                    <span className="orderSheetCompactStatValue">{passengersCount}</span>
                  </span>
                  <span className="orderSheetCompactStat">
                    <OrderCardIcon name="luggage" />
                    <span className="orderSheetCompactStatValue">{luggageUnits}</span>
                  </span>
                </div>
              </div>
            </section>

            <section className="orderSheetCard">
              <div className="orderSheetSectionHeader">
                <OrderCardIcon name="location" tone="accent" />
                <h4 className="orderSheetSectionTitle">{t('contract.tripInfo')}</h4>
              </div>

              <div className="orderSheetRouteRows">
                <div className="orderSheetRouteTimeline" aria-hidden="true">
                  <span className="orderSheetRouteDot orderSheetRouteDot--from" />
                  <span className="orderSheetRouteLine" />
                  <span className="orderSheetRouteDot orderSheetRouteDot--to" />
                </div>

                <div className="orderSheetRouteContent">
                  <div className="orderSheetRouteRow">
                    <span className="orderSheetInfoLabel">{t('contract.from')}</span>
                    <span className="orderSheetInfoValue">{getLocation(trip.from)}</span>
                  </div>
                  <div className="orderSheetRouteRow">
                    <span className="orderSheetInfoLabel">{t('contract.to')}</span>
                    <span className="orderSheetInfoValue">{getLocation(trip.to)}</span>
                  </div>
                </div>
              </div>

              <div className="orderSheetRows orderSheetRows--afterRoute">
                <div className="orderSheetInfoRow">
                  <div className="orderSheetInfoLead">
                    <OrderCardIcon name="clock" />
                    <span className="orderSheetInfoLabel">{t('contract.tripTime')}</span>
                  </div>
                  <span className="orderSheetInfoValue">{tripTime}</span>
                </div>

                <div className="orderSheetInfoRow">
                  <div className="orderSheetInfoLead">
                    <OrderCardIcon name="wallet" />
                    <span className="orderSheetInfoLabel">{t('contract.payment')}</span>
                  </div>
                  <span className="orderSheetInfoValue">{trip.paymentMethod || "-"}</span>
                </div>

                {driverComment ? (
                  <div className="orderSheetInfoRow orderSheetInfoRow--driverComment">
                    <div className="orderSheetInfoLead orderSheetInfoLead--alignStart">
                      <OrderCardIcon name="file" />
                      <span className="orderSheetInfoLabel">{t('contract.driverComment')}</span>
                    </div>
                    <span className="orderSheetInfoValue orderSheetInfoValue--driverComment">
                      {driverComment}
                    </span>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="orderSheetCard">
              <div className="orderSheetSectionHeader">
                <OrderCardIcon name="file" tone="accent" />
                <h4 className="orderSheetSectionTitle">{t('contract.documentDetails')}</h4>
              </div>

              <div className="orderSheetRows">
                <div className="orderSheetInfoRow">
                  <div className="orderSheetInfoLead">
                    <OrderCardIcon name="tag" />
                    <span className="orderSheetInfoLabel">{t('contract.priceValue')}</span>
                  </div>
                  <div className="orderSheetPriceValue">
                    <span className="orderSheetInfoValue">{storedPrice || "-"}</span>
                    <button
                      className="orderSheetEditButton"
                      type="button"
                      onClick={openPriceEditor}
                      aria-label={t('contract.editPrice')}
                    >
                      <OrderGlyph name="edit" />
                    </button>
                  </div>
                </div>

                <div className="orderSheetInfoRow orderSheetInfoRow--commission">
                  <div className="orderSheetInfoLead">
                    <OrderCardIcon name="percent" />
                    <span className="orderSheetInfoLabel">{t('contract.commission')}</span>
                  </div>
                  <div className="orderSheetPriceValue">
                    <span className="orderSheetInfoValue">{storedCommission || "-"}</span>
                    <button
                      className="orderSheetEditButton"
                      type="button"
                      onClick={openCommissionEditor}
                      aria-label={t('contract.editCommission')}
                    >
                      <OrderGlyph name="edit" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="orderSheetTotalBar">
              <span className="orderSheetTotalIcon">
                <OrderGlyph name="wallet" />
              </span>
              <div className="orderSheetTotalCopy">
                <span className="orderSheetTotalLabel">{t('contract.amountDue')}</span>
                <strong className="orderSheetTotalValue">{amountDue}</strong>
              </div>
            </section>

            <div className="orderDrawer-actions orderDrawer-actions--doc">
              <button
                className="orderWindow-button orderWindow-button--doc"
                type="button"
                onClick={() => handleDownloadPdf("offer")}
                disabled={isGenerating}
              >
                {isGenerating ? <RequestLoader inline size="sm" label={t('common.generating')} /> : t('contract.offerPdf')}
              </button>
              <button
                className="orderWindow-button orderWindow-button--doc"
                type="button"
                onClick={() => handleDownloadPdf("confirmation")}
                disabled={isGenerating}
              >
                {isGenerating ? <RequestLoader inline size="sm" label={t('common.generating')} /> : t('contract.confirmationPdf')}
              </button>
            </div>

            <div className="orderDrawer-actions orderDrawer-actions--stacked">
              <button
                className="orderWindow-button orderWindow-button--success"
                type="button"
                onClick={handleSaveAndClose}
                disabled={isUpdatingOrder}
              >
                {isUpdatingOrder ? <RequestLoader inline size="sm" label={t('common.saving')} /> : t('common.save')}
              </button>
              {canTransfer ? (
                <button
                  className="orderWindow-button orderWindow-button--transfer"
                  type="button"
                  onClick={() => setShowTransfer(true)}
                >
                  {t('contract.transferOrder')}
                </button>
              ) : null}
              <button
                className="orderWindow-button orderWindow-button--danger"
                type="button"
                onClick={handleDelete}
              >
                {t('common.delete')}
              </button>
            </div>

            {showTransfer ? (
              <section className="orderDrawer-transfer">
                <div className="orderDrawer-sectionTitleRow">
                  <h4 className="orderDrawer-sectionTitle">{t('contract.transferToAnotherDriver')}</h4>
                  <p className="orderDrawer-transferCopy">{t('contract.chooseDriverHint')}</p>
                </div>

                <div className="orderDrawer-transferControls">
                  <label className="orderWindow-field">
                    <span>{t('common.search')}</span>
                    <input
                      type="text"
                      value={transferSearch}
                      onChange={(event) =>
                        setTransferSearch(event.target.value)
                      }
                      placeholder={t('contract.searchByNameOrEmail')}
                    />
                  </label>
                  <button
                    className="orderWindow-button orderWindow-button--secondary"
                    type="button"
                    onClick={() => setTransferSearch("")}
                    disabled={!transferSearch || isUsersFetching}
                  >
                    {t('common.reset')}
                  </button>
                </div>

                {isUsersFetching ? (
                  <RequestLoadingState className="orderWindow-state" label={t('contract.loadingDrivers')} />
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
                              {user.name || t('common.noName')}
                            </span>
                            <span className="orderWindow-userMeta">
                              {isCurrentOwner
                                ? t('contract.currentDriver')
                                : getTransferLabel(user)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                {!isUsersFetching && !transferUsers.length ? (
                  <p className="orderWindow-state">{t('contract.noDrivers')}</p>
                ) : null}

                {selectedTransferUser ? (
                  <div className="orderDrawer-selected">
                    <p className="orderWindow-label">{t('contract.selectedDriver')}</p>
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
                    {isTransferring ? (
                      <RequestLoader inline size="sm" label={t('common.transferring')} />
                    ) : (
                      t('contract.confirmTransfer')
                    )}
                  </button>
                  <button
                    className="orderWindow-button"
                    type="button"
                    onClick={() => setShowTransfer(false)}
                  >
                    {t('common.back')}
                  </button>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      {priceEditorOpen ? (
        <div
          className="orderPriceEditor"
          role="presentation"
          onClick={closePriceEditor}
        >
          <div
            className="orderPriceEditor-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t('contract.priceEditorTitle')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="orderPriceEditor-header">
              <h4 className="orderPriceEditor-title">{t('contract.priceEditorTitle')}</h4>
              <p className="orderPriceEditor-copy">{t('contract.priceEditorCopy')}</p>
            </div>

            <div className="orderPriceEditor-field">
              <div className="orderCommissionField-row">
                <div className="orderCommissionField-inputWrap">
                  <input
                    className="orderWindow-input orderCommissionField-input"
                    type="text"
                    inputMode="decimal"
                    aria-label={t('contract.tripPrice')}
                    placeholder={`${t('contract.tripPrice')} *`}
                    value={priceInput}
                    onChange={handlePriceInputChange}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void savePrice();
                      }
                    }}
                  />
                </div>

                {["EUR", "CZK"].map((item) => (
                  <button
                    key={item}
                    className={`orderCommissionField-currencyButton ${priceCurrency === item ? "is-active" : ""}`}
                    type="button"
                    onClick={() => handlePriceCurrencyChange(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {priceInput ? (
                <p className="orderCommissionField-converted">
                  {formatPrice(priceInput, priceCurrency)}
                </p>
              ) : null}
            </div>

            <div className="orderPriceEditor-actions">
              <button
                className="orderWindow-button orderWindow-button--accent"
                type="button"
                onClick={() => void savePrice()}
                disabled={isUpdatingOrder}
              >
                {isUpdatingOrder ? <RequestLoader inline size="sm" label={t('common.saving')} /> : t('contract.savePrice')}
              </button>
              <button
                className="orderWindow-button orderWindow-button--secondary"
                type="button"
                onClick={closePriceEditor}
                disabled={isUpdatingOrder}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {commissionEditorOpen ? (
        <div
          className="orderPriceEditor"
          role="presentation"
          onClick={closeCommissionEditor}
        >
          <div
            className="orderPriceEditor-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t('contract.commissionEditorTitle')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="orderPriceEditor-header">
              <h4 className="orderPriceEditor-title">{t('contract.commissionEditorTitle')}</h4>
              <p className="orderPriceEditor-copy">{t('contract.commissionEditorCopy')}</p>
            </div>

            <div className="orderPriceEditor-field">
              <div className="orderCommissionField-row">
                <div className="orderCommissionField-inputWrap">
                  <input
                    className="orderWindow-input orderCommissionField-input"
                    type="text"
                    inputMode="decimal"
                    aria-label={t('contract.commission')}
                    placeholder={`${t('contract.commission')} *`}
                    value={commissionInput}
                    onChange={handleCommissionInputChange}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleSaveCommission();
                      }
                    }}
                  />
                </div>

                {["EUR", "CZK"].map((item) => (
                  <button
                    key={item}
                    className={`orderCommissionField-currencyButton ${commissionCurrency === item ? "is-active" : ""}`}
                    type="button"
                    onClick={() => handleCommissionCurrencyChange(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {commissionConverted ? (
                <p className="orderCommissionField-converted">{commissionConverted}</p>
              ) : null}
            </div>

            <div className="orderPriceEditor-actions">
              <button
                className="orderWindow-button orderWindow-button--accent"
                type="button"
                onClick={() => void handleSaveCommission()}
                disabled={isUpdatingOrder}
              >
                {isUpdatingOrder ? <RequestLoader inline size="sm" label={t('common.saving')} /> : t('contract.saveCommission')}
              </button>
              <button
                className="orderWindow-button orderWindow-button--secondary"
                type="button"
                onClick={closeCommissionEditor}
                disabled={isUpdatingOrder}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {flightNumberEditorOpen ? (
        <div
          className="orderPriceEditor"
          role="presentation"
          onClick={closeFlightNumberEditor}
        >
          <div
            className="orderPriceEditor-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t('contract.flightNumberEditorTitle')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="orderPriceEditor-header">
              <h4 className="orderPriceEditor-title">{t('contract.flightNumberEditorTitle')}</h4>
              <p className="orderPriceEditor-copy">{t('contract.flightNumberEditorCopy')}</p>
            </div>

            <div className="orderPriceEditor-field">
              <input
                className="orderWindow-input orderPriceEditor-input"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                aria-label={t('contract.flightNumber')}
                placeholder={t('contract.flightNumber')}
                value={flightNumberInput}
                onChange={handleFlightNumberInputChange}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void saveFlightNumber();
                  }
                }}
              />
              <p className="orderPriceEditor-hint">{t('contract.flightNumberEditorHint')}</p>
            </div>

            <div className="orderPriceEditor-actions">
              <button
                className="orderWindow-button orderWindow-button--accent"
                type="button"
                onClick={() => void saveFlightNumber()}
                disabled={isUpdatingOrder}
              >
                {isUpdatingOrder ? <RequestLoader inline size="sm" label={t('common.saving')} /> : t('contract.saveFlightNumber')}
              </button>
              <button
                className="orderWindow-button orderWindow-button--secondary"
                type="button"
                onClick={closeFlightNumberEditor}
                disabled={isUpdatingOrder}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

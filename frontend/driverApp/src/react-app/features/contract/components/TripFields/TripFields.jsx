import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Picker from 'react-mobile-picker';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import { SvgIcon } from '@shared/app/components/SvgIcon/SvgIcon.jsx';
import { formatDateTime } from '@shared/app/utils/dateFormat.js';
import { AddressAutocompleteField } from '../../../addressAutocomplete/AddressAutocompleteField.jsx';
import { selectTrip, updateTripField } from '../../contractSlice.js';
import './TripFields.css';

const MINUTE_STEP = 5;
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0'),
);
const MINUTE_OPTIONS = Array.from(
  { length: 60 / MINUTE_STEP },
  (_, index) => String(index * MINUTE_STEP).padStart(2, '0'),
);

function getPaymentIcon(key) {
  if (key === 'card') {
    return <SvgIcon name="card" />;
  }

  if (key === 'cash') {
    return <SvgIcon name="cash" />;
  }

  return <SvgIcon name="invoice" />;
}

export function TripFields() {
  const { language, t } = useI18n();
  const dispatch = useDispatch();
  const trip = useSelector(selectTrip);
  const dateInputRef = useRef(null);
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const selectedDate = toDateValue(trip.time);
  const formattedTripTime = selectedDate ? formatDateTime(selectedDate, language) : '';
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState('');
  const [draftTime, setDraftTime] = useState({
    hour: '00',
    minute: '00',
  });
  const draftDateLabel = draftDate ? formatDateLabel(draftDate, language) : '';
  const paymentMethods = [
    { key: 'card', label: t('contract.card') },
    { key: 'cash', label: t('contract.cash') },
    { key: 'invoice', label: t('contract.invoice') },
  ];

  useEffect(() => {
    if (!isTimePickerOpen) {
      return undefined;
    }

    const body = document.body;
    body.classList.add('no-scroll');

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsTimePickerOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      body.classList.remove('no-scroll');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTimePickerOpen]);

  function openTimePicker() {
    const nextDraft = buildPickerDraft(trip.time);
    setDraftDate(nextDraft.date);
    setDraftTime({
      hour: nextDraft.hour,
      minute: nextDraft.minute,
    });
    setIsTimePickerOpen(true);
  }

  function closeTimePicker() {
    setIsTimePickerOpen(false);
  }

  function openDatePicker() {
    const input = dateInputRef.current;

    if (!input) {
      return;
    }

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  }

  function saveTimePicker() {
    if (!draftDate) {
      return;
    }

    dispatch(
      updateTripField({
        key: 'time',
        value: `${draftDate}T${draftTime.hour}:${draftTime.minute}`,
      }),
    );
    setIsTimePickerOpen(false);
  }

  return (
    <>
      <div className="contractFieldsBlock">
        <label className="contractField">
          <AddressAutocompleteField
            apiKey={mapsApiKey}
            ariaLabel={t('contract.pickupAddress')}
            clearLabel={t('contract.clearPickupAddress')}
            placeholder={`${t('contract.pickupAddress')} *`}
            value={trip.from?.address || ''}
            onChange={value => dispatch(updateTripField({ key: 'from', value }))}
            onClear={() => dispatch(updateTripField({ key: 'from', value: '' }))}
          />
        </label>

        <label className="contractField">
          <AddressAutocompleteField
            apiKey={mapsApiKey}
            ariaLabel={t('contract.dropoffAddress')}
            clearLabel={t('contract.clearDropoffAddress')}
            placeholder={`${t('contract.dropoffAddress')} *`}
            value={trip.to?.address || ''}
            onChange={value => dispatch(updateTripField({ key: 'to', value }))}
            onClear={() => dispatch(updateTripField({ key: 'to', value: '' }))}
          />
        </label>

        <label className="contractField">
          <div className={`contractDateField ${trip.time ? 'is-selected' : ''}`}>
            <button
              className="contractDateField-trigger"
              type="button"
              onClick={openTimePicker}
              aria-label={formattedTripTime || t('contract.pickupDateTime')}
            >
              <span className="contractDateField-icon" aria-hidden="true">
                <SvgIcon name="calendar" />
              </span>
              <span className={`contractDateField-value ${trip.time ? '' : 'is-placeholder'}`}>
                {formattedTripTime || `${t('contract.pickupDateTime')} *`}
              </span>
            </button>
            {trip.time ? (
              <button
                className="contractField-clear contractDateField-clear"
                type="button"
                aria-label={t('contract.clearPickupDateTime')}
                onClick={() => dispatch(updateTripField({ key: 'time', value: '' }))}
              >
                ×
              </button>
            ) : null}
          </div>
        </label>

        <div className="paymentMethodBlock">
          <div className="paymentMethodLabel">
            <span>{t('contract.paymentMethod')}</span>
            <span aria-hidden="true" className="paymentMethodRequired">
              *
            </span>
          </div>
          <div className="paymentMethodButtons">
            {paymentMethods.map(method => (
              <button
                key={method.key}
                className={`paymentMethodButton ${trip.paymentMethod === method.key ? 'is-active' : ''}`}
                type="button"
                onClick={() => dispatch(updateTripField({ key: 'paymentMethod', value: method.key }))}
              >
                <span className="paymentMethodButton-icon" aria-hidden="true">
                  {getPaymentIcon(method.key)}
                </span>
                {method.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isTimePickerOpen ? (
        <div className="contractDatePickerModal" role="presentation">
          <div className="contractDatePickerModal-backdrop" onClick={closeTimePicker} />

          <div
            className="contractDatePickerModal-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contractDatePickerTitle"
          >
            <div className="contractDatePickerModal-handle" aria-hidden="true" />

            <div className="contractDatePickerModal-header">
              <div className="contractDatePickerModal-copy">
                <h3 id="contractDatePickerTitle">{t('contract.pickupDateTime')}</h3>
                <p>{getPickupTimeHint(language)}</p>
              </div>
              <button
                className="contractDatePickerModal-close"
                type="button"
                aria-label={t('common.close')}
                onClick={closeTimePicker}
              >
                ×
              </button>
            </div>

            <div className="contractDatePickerModal-body">
              <div className="contractDatePickerField">
                <span className="contractDatePickerLabel">{t('common.date')}</span>
                <label className="contractDatePickerDateField" onClick={openDatePicker}>
                  <input
                    ref={dateInputRef}
                    className="contractDatePickerDateNativeInput"
                    type="date"
                    value={draftDate}
                    onChange={event => setDraftDate(event.target.value)}
                  />
                  <div className="contractDatePickerDateSurface" aria-hidden="true">
                    <span className="contractDatePickerDateIcon">
                      <SvgIcon name="calendar" />
                    </span>
                    <span className={`contractDatePickerDateValue ${draftDateLabel ? '' : 'is-placeholder'}`}>
                      {draftDateLabel || t('common.date')}
                    </span>
                    <span className="contractDatePickerDateChevron">
                      <SvgIcon name="chevron-right" />
                    </span>
                  </div>
                </label>
              </div>

              <div className="contractDatePickerField">
                <span className="contractDatePickerLabel">{t('contract.tripTime')}</span>
                <div className="contractDatePickerWheel">
                  <Picker
                    className="contractDatePickerWheelPicker"
                    value={draftTime}
                    onChange={setDraftTime}
                    height={220}
                    itemHeight={44}
                    wheelMode="natural"
                  >
                    <Picker.Column name="hour">
                      {HOUR_OPTIONS.map(option => (
                        <Picker.Item key={option} value={option}>
                          {({ selected }) => (
                            <div className={`contractDatePickerWheelItem ${selected ? 'is-selected' : ''}`}>
                              {option}
                            </div>
                          )}
                        </Picker.Item>
                      ))}
                    </Picker.Column>

                    <Picker.Column name="minute">
                      {MINUTE_OPTIONS.map(option => (
                        <Picker.Item key={option} value={option}>
                          {({ selected }) => (
                            <div className={`contractDatePickerWheelItem ${selected ? 'is-selected' : ''}`}>
                              {option}
                            </div>
                          )}
                        </Picker.Item>
                      ))}
                    </Picker.Column>
                  </Picker>
                  <div className="contractDatePickerWheelMarker" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="contractDatePickerModal-actions">
              <button
                className="contractDatePickerModal-secondary"
                type="button"
                onClick={closeTimePicker}
              >
                {t('common.cancel')}
              </button>
              <button
                className="contractDatePickerModal-primary"
                type="button"
                onClick={saveTimePicker}
                disabled={!draftDate}
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function formatDateLabel(value, language) {
  const date = toDateValue(`${value}T00:00`);

  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat(language || 'en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getPickupTimeHint(language) {
  if (language === 'uk') {
    return 'Оберіть час подачі автомобіля';
  }

  if (language === 'cs') {
    return 'Zvolte čas přistavení vozidla';
  }

  return 'Choose the vehicle pickup time';
}

function buildPickerDraft(value) {
  const sourceDate = value ? toDateValue(value) : new Date();
  const alignedDate = alignDateToMinuteStep(sourceDate || new Date(), MINUTE_STEP);

  return {
    date: formatDateInputValue(alignedDate),
    hour: String(alignedDate.getHours()).padStart(2, '0'),
    minute: String(alignedDate.getMinutes()).padStart(2, '0'),
  };
}

function alignDateToMinuteStep(date, step) {
  const nextDate = new Date(date);

  if (Number.isNaN(nextDate.getTime())) {
    return new Date();
  }

  nextDate.setSeconds(0, 0);
  const remainder = nextDate.getMinutes() % step;

  if (remainder !== 0) {
    nextDate.setMinutes(nextDate.getMinutes() + (step - remainder));
  }

  return nextDate;
}

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toDateValue(value) {
  const text = toDateTimeLocalValue(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateTimeLocalValue(value) {
  const text = String(value ?? '').trim();

  if (!text) {
    return '';
  }

  const match = text.match(
    /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/,
  );

  if (match) {
    return `${match[1]}T${match[2] || '00:00'}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return text;
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}T${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
}

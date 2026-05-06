import { useEffect, useRef, useState } from 'react';

import { createAutocompleteSessionToken, fetchCzechAutocompleteSuggestions } from './googleMapsAutocomplete.js';
import './addressAutocomplete.css';

export function AddressAutocompleteField({
  apiKey,
  ariaLabel,
  clearLabel,
  placeholder,
  value,
  onChange,
  onClear,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [sessionToken, setSessionToken] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const requestIdRef = useRef(0);
  const blurTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        window.clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSuggestions([]);
      setIsLoading(false);
      setStatusMessage('');
      return;
    }

    const text = String(value ?? '').trim();

    if (!apiKey || !text) {
      setSuggestions([]);
      setIsLoading(false);
      setStatusMessage(!apiKey ? 'Add VITE_GOOGLE_MAPS_API_KEY and restart the dev server.' : '');
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        let nextToken = sessionToken;

        if (!nextToken) {
          nextToken = await createAutocompleteSessionToken(apiKey);
          setSessionToken(nextToken);
        }

        const results = await fetchCzechAutocompleteSuggestions({
          apiKey,
          input: text,
          sessionToken: nextToken,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setSuggestions(results);
        setStatusMessage(results.length ? '' : 'No Czech address matches found.');
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setSuggestions([]);
        setStatusMessage('Google Maps autocomplete is unavailable.');
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [apiKey, isOpen, sessionToken, value]);

  const handleFocus = async () => {
    setIsOpen(true);

    if (!sessionToken && apiKey) {
      try {
        // Починаємо нову сесію, коли користувач відкриває поле.
        const nextToken = await createAutocompleteSessionToken(apiKey);
        setSessionToken(nextToken);
      } catch (error) {
        setSessionToken(null);
        setStatusMessage('Google Maps autocomplete is unavailable.');
      }
    }
  };

  const handleBlur = () => {
    blurTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  const handleSelect = async suggestion => {
    if (suggestion.value) {
      onChange(suggestion.value);
      setIsOpen(false);
      setSuggestions([]);
      return;
    }

    const place = suggestion.placePrediction?.toPlace?.();

    if (!place) {
      return;
    }

    try {
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress'],
      });

      onChange(place.formattedAddress || place.displayName || suggestion.label);
      setSessionToken(null);
    } catch (error) {
      onChange(suggestion.label);
    } finally {
      setIsOpen(false);
      setSuggestions([]);
    }
  };

  return (
    <div className="addressAutocompleteField">
      <div className="addressAutocompleteControl">
        <input
          className="contractField-input"
          type="text"
          placeholder={placeholder}
          aria-label={ariaLabel}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={event => onChange(event.target.value)}
        />
        {value ? (
          <button className="contractField-clear" type="button" aria-label={clearLabel} onClick={onClear}>
            ×
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="addressAutocompleteMenu" role="listbox" aria-label={ariaLabel}>
          {isLoading ? <div className="addressAutocompleteStatus">...</div> : null}
          {!isLoading && statusMessage ? (
            <div className="addressAutocompleteStatus">{statusMessage}</div>
          ) : null}
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              className="addressAutocompleteItem"
              type="button"
              onMouseDown={event => event.preventDefault()}
              onClick={() => handleSelect(suggestion)}
            >
              <span className="addressAutocompleteIndex">
                {index + 1}.
              </span>
              <span className="addressAutocompleteText">{suggestion.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

let googleMapsPlacesPromise = null;

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-places-js';

export async function loadGoogleMapsPlaces(apiKey) {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps autocomplete works only in the browser.');
  }

  if (window.google?.maps?.importLibrary) {
    return window.google.maps;
  }

  if (!apiKey) {
    throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY.');
  }

  if (!googleMapsPlacesPromise) {
    googleMapsPlacesPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
      if (existingScript) {
        existingScript.addEventListener(
          'load',
          () => {
            resolve(window.google.maps);
          },
          { once: true },
        );
        existingScript.addEventListener(
          'error',
          () => {
            reject(new Error('Failed to load Google Maps script.'));
          },
          { once: true },
        );
        return;
      }

      // Підвантажуємо Places лише один раз і тільки в браузері.
      const callbackName = '__googleMapsPlacesReady';
      const previousCallback = window[callbackName];

      window[callbackName] = () => {
        if (typeof previousCallback === 'function') {
          previousCallback();
        }

        resolve(window.google.maps);
      };

      const script = document.createElement('script');
      script.id = GOOGLE_MAPS_SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script.'));
      };
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&libraries=places&v=weekly&callback=${callbackName}&language=cs&region=CZ`;

      document.head.appendChild(script);
    });
  }

  return googleMapsPlacesPromise;
}

export async function createAutocompleteSessionToken(apiKey) {
  const maps = await loadGoogleMapsPlaces(apiKey);
  const { AutocompleteSessionToken } = await maps.importLibrary('places');

  // Сесія зменшує зайві білінг-запити під час набору адреси.
  return new AutocompleteSessionToken();
}

export async function fetchCzechAutocompleteSuggestions({ apiKey, input, sessionToken }) {
  const maps = await loadGoogleMapsPlaces(apiKey);
  const { AutocompleteSuggestion } = await maps.importLibrary('places');

  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input,
    includedRegionCodes: ['cz'],
    sessionToken,
  });

  return suggestions
    .map((suggestion, index) => {
      const placePrediction = suggestion.placePrediction;

      if (!placePrediction) {
        return null;
      }

      return {
        id: placePrediction.placeId || `${placePrediction.text.toString()}-${index}`,
        label: placePrediction.text.toString(),
        placePrediction,
      };
    })
    .filter(Boolean);
}

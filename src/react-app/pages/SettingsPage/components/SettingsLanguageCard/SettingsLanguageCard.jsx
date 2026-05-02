import { useEffect, useState } from 'react';

import './SettingsLanguageCard.css';

const LANGUAGE_KEY = 'pdf-app-language';

function getStoredLanguage() {
  // Беремо мову з localStorage, якщо вона вже була вибрана.
  try {
    const value = localStorage.getItem(LANGUAGE_KEY);
    return ['uk', 'en', 'cs'].includes(value) ? value : 'uk';
  } catch {
    return 'uk';
  }
}

function saveLanguage(language) {
  // Запам'ятовуємо мову для наступного запуску.
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Ігноруємо помилки сховища.
  }
}

export function SettingsLanguageCard() {
  const [language, setLanguage] = useState(getStoredLanguage);

  useEffect(() => {
    // Оновлюємо мову документа одразу після зміни.
    document.documentElement.lang = language;
    saveLanguage(language);
  }, [language]);

  return (
    <section className="screenCard settingsLanguageCard">
      <div className="compactHeader">
        <h2>Language</h2>
        <p>Choose the interface language for this device.</p>
      </div>

      <label className="settingsLanguageCard-field">
        <span className="settingsLanguageCard-label">Interface language</span>
        <select value={language} onChange={event => setLanguage(event.target.value)}>
          <option value="uk">Українська</option>
          <option value="en">English</option>
          <option value="cs">Čeština</option>
        </select>
      </label>

      <p className="settingsLanguageCard-note">
        The selected language is stored for the user and admin spaces on this device.
      </p>
    </section>
  );
}

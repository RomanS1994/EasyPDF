export const SUPPORTED_PDF_LANGUAGES = ['uk', 'en', 'cs'];
export const DEFAULT_PDF_LANGUAGE = 'uk';

const PDF_MESSAGES = {
  uk: {
    document: {
      offerHeading: 'Пропозиція перевезення пасажирів',
      confirmationHeading: 'Договір перевезення пасажирів',
      offerTitle: 'Пропозиція перевезення',
      confirmationTitle: 'Договір перевезення',
    },
    paymentMethod: 'готівкою / карткою на місці',
    subtitle: {
      carrier: 'Перевізник / Водій:',
      provider: 'Посередник (Постачальник послуги):',
      customer: 'Замовник / Пасажир:',
      trip: 'Дані про перевезення:',
    },
    labels: {
      name: 'Ім’я:',
      companyName: 'Ім’я / Назва компанії:',
      address: 'Адреса:',
      vehiclePlate: 'Номерний знак:',
      ico: 'ЄДРПОУ / ІПН:',
      emailPhone: 'E-mail, телефон:',
      passengers: 'Кількість клієнтів:',
      pickup: 'Місце посадки:',
      dropoff: 'Місце висадки:',
      datetime: 'Дата та час:',
      price: 'Ціна:',
      payment: 'Спосіб оплати:',
    },
    notice: 'Договір укладено відповідно до чинного законодавства про автомобільні перевезення',
    header: {
      issued: 'Дата видачі:',
    },
    issuedIn: 'У Празі',
    carrierSignature: 'Підпис перевізника:',
    customerSignature: 'Підпис замовника:',
  },
  en: {
    document: {
      offerHeading: 'Passenger transport offer',
      confirmationHeading: 'Passenger transport agreement',
      offerTitle: 'Transport offer',
      confirmationTitle: 'Transport agreement',
    },
    paymentMethod: 'cash / card on site',
    subtitle: {
      carrier: 'Carrier / Driver:',
      provider: 'Intermediary (Service provider):',
      customer: 'Customer / Passenger:',
      trip: 'Transport details:',
    },
    labels: {
      name: 'Name:',
      companyName: 'Name / Company name:',
      address: 'Address:',
      vehiclePlate: 'Vehicle plate:',
      ico: 'Company ID:',
      emailPhone: 'E-mail, phone:',
      passengers: 'Number of passengers:',
      pickup: 'Pickup point:',
      dropoff: 'Drop-off point:',
      datetime: 'Date and time:',
      price: 'Price:',
      payment: 'Payment method:',
    },
    notice: 'The agreement was concluded in accordance with the applicable road transport legislation',
    header: {
      issued: 'Issued on:',
    },
    issuedIn: 'In Prague',
    carrierSignature: 'Carrier signature:',
    customerSignature: 'Customer signature:',
  },
  cs: {
    document: {
      offerHeading: 'Nabídka přepravy osob',
      confirmationHeading: 'Smlouva o přepravě osob',
      offerTitle: 'Přepravní nabídka',
      confirmationTitle: 'Přepravní smlouva',
    },
    paymentMethod: 'hotovost / kartou na místě',
    subtitle: {
      carrier: 'Přepravce / Řidič:',
      provider: 'Zprostředkovatel (Poskytovatel služby):',
      customer: 'Objednatel / Cestující:',
      trip: 'Údaje o přepravě:',
    },
    labels: {
      name: 'Jméno:',
      companyName: 'Jméno / Název firmy:',
      address: 'Adresa:',
      vehiclePlate: 'SPZ vozidla:',
      ico: 'IČ:',
      emailPhone: 'E-mail, telefon:',
      passengers: 'Počet klientů:',
      pickup: 'Místo nástupu:',
      dropoff: 'Místo ukončení:',
      datetime: 'Datum a čas:',
      price: 'Cena:',
      payment: 'Způsob platby:',
    },
    notice: 'Smlouva uzavřena dle § 21 odst. 5 zákona č. 111/1994 Sb., o silniční dopravě',
    header: {
      issued: 'Datum vystavení:',
    },
    issuedIn: 'V Praze dne',
    carrierSignature: 'Podpis přepravce:',
    customerSignature: 'Podpis objednatele:',
  },
};

export function normalizePdfLanguage(value) {
  return SUPPORTED_PDF_LANGUAGES.includes(value) ? value : DEFAULT_PDF_LANGUAGE;
}

export function getPdfMessage(language, key) {
  const parts = String(key || '').split('.');
  let current = PDF_MESSAGES[normalizePdfLanguage(language)] || PDF_MESSAGES[DEFAULT_PDF_LANGUAGE];

  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return key;
    }

    current = current[part];
  }

  return typeof current === 'string' ? current : key;
}

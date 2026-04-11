const SUPPORTED_LANGUAGES = new Set(['uk', 'en', 'cs']);

const TRANSLATIONS = {
  uk: {
    app_name: 'TransferDocs',
    offer_title: 'Комерційна пропозиція трансферу',
    confirmation_title: 'Підтвердження трансферу',
    offer_subtitle:
      'PDF з акцентом на маршрут, ціну та обсяг послуги до остаточного підтвердження.',
    confirmation_subtitle:
      'Підтверджений PDF з деталями поїздки, учасниками та сервісними умовами.',
    plan: 'План',
    price: 'Ціна',
    monthly_limit: 'Ліміт на місяць',
    document_quality: 'Рівень PDF',
    document_type: 'Тип документа',
    customer: 'Клієнт',
    driver: 'Водій',
    provider: 'Перевізник',
    pickup: 'Посадка',
    dropoff: 'Висадка',
    departure_time: 'Час виїзду',
    payment: 'Оплата',
    total: 'Сума',
    order_number: 'Номер замовлення',
    issue_date: 'Дата випуску',
    valid_until: 'Діє до',
    trip_overview: 'Огляд поїздки',
    parties: 'Учасники',
    service_scope: 'Що входить',
    service_terms: 'Сервісні умови',
    premium_operations: 'Premium operations',
    next_steps: 'Наступні кроки',
    signatures: 'Підписи',
    carrier_signature: 'Підпис перевізника',
    customer_signature: 'Підпис клієнта',
    support: 'Підтримка',
    reference_id: 'Reference ID',
    generated_by: 'Згенеровано бекендом TransferDocs',
    note: 'Примітка',
    offer: 'Пропозиція',
    confirmation: 'Підтвердження',
    essential: 'Базовий PDF',
    branded: 'Branded PDF',
    premium: 'Premium PDF',
    starter_offer_note:
      'Короткий offer-пакет для швидкого узгодження вартості, маршруту та часу.',
    starter_confirmation_note:
      'Компактне підтвердження для приватного водія або малого щоденного потоку.',
    growth_offer_note:
      'Брендований offer з розширеним summary для стабільної операційної роботи.',
    growth_confirmation_note:
      'Більш деталізоване підтвердження з service highlights та readiness block.',
    scale_offer_note:
      'Преміальний offer для командного або партнерського потоку з операційним контекстом.',
    scale_confirmation_note:
      'Розширений confirmation PDF з ops, legal та audit-ready блоками.',
    shared_scope_1: 'Маршрут, час виїзду та контакт клієнта',
    shared_scope_2: 'Вартість поїздки та спосіб оплати',
    shared_scope_3: 'Внутрішній reference/order ID для трекінгу',
    growth_scope_1: 'Виділений summary для партнера або dispatch',
    growth_scope_2: 'Service highlights і branded accent sections',
    scale_scope_1: 'Operations desk, service SLA та premium support note',
    scale_scope_2: 'Audit-ready reference block і expanded terms summary',
    offer_term_1: 'Ціна і маршрут зафіксовані на момент випуску документа.',
    offer_term_2: 'Зміна адреси або часу може змінити остаточну ціну.',
    offer_term_3: 'Підтвердження бронювання відбувається після погодження деталей.',
    confirmation_term_1: 'Трансфер підтверджено на погоджені дату, час і маршрут.',
    confirmation_term_2: 'Клієнт отримує сервіс згідно з даними цього документа.',
    confirmation_term_3: 'Зміни після підтвердження обробляються як окремий запит.',
    premium_term_1: 'Premium plan додає розширений operational context для команди.',
    premium_term_2: 'Документ придатний для внутрішнього audit trail та partner handoff.',
    next_step_offer_1: 'Погодити фінальний маршрут і контакт на день поїздки.',
    next_step_offer_2: 'Підтвердити оплату або умови розрахунку.',
    next_step_confirmation_1: 'Використати document reference для support або dispatch.',
    next_step_confirmation_2: 'Передати клієнту фінальну confirmation copy.',
    support_note_starter: 'Питання по бронюванню вирішуються напряму з перевізником.',
    support_note_growth: 'Growth PDF додатково підходить для branded handoff клієнту.',
    support_note_scale: 'Scale PDF розрахований на командну роботу, audit і premium support.',
  },
  en: {
    app_name: 'TransferDocs',
    offer_title: 'Transfer offer',
    confirmation_title: 'Transfer confirmation',
    offer_subtitle:
      'Offer PDF focused on route, pricing, and service scope before final confirmation.',
    confirmation_subtitle:
      'Confirmed PDF with trip details, parties, and service terms.',
    plan: 'Plan',
    price: 'Price',
    monthly_limit: 'Monthly limit',
    document_quality: 'Document quality',
    document_type: 'Document type',
    customer: 'Customer',
    driver: 'Driver',
    provider: 'Provider',
    pickup: 'Pickup',
    dropoff: 'Dropoff',
    departure_time: 'Departure time',
    payment: 'Payment',
    total: 'Total',
    order_number: 'Order number',
    issue_date: 'Issue date',
    valid_until: 'Valid until',
    trip_overview: 'Trip overview',
    parties: 'Parties',
    service_scope: 'Service scope',
    service_terms: 'Service terms',
    premium_operations: 'Premium operations',
    next_steps: 'Next steps',
    signatures: 'Signatures',
    carrier_signature: 'Carrier signature',
    customer_signature: 'Customer signature',
    support: 'Support',
    reference_id: 'Reference ID',
    generated_by: 'Generated by TransferDocs backend',
    note: 'Note',
    offer: 'Offer',
    confirmation: 'Confirmation',
    essential: 'Essential PDF',
    branded: 'Branded PDF',
    premium: 'Premium PDF',
    starter_offer_note:
      'Compact offer package for quick pricing, routing, and timing alignment.',
    starter_confirmation_note:
      'Compact confirmation for a private driver or a small daily transfer flow.',
    growth_offer_note:
      'Branded offer with richer summary blocks for stable operational handoff.',
    growth_confirmation_note:
      'More detailed confirmation with service highlights and readiness sections.',
    scale_offer_note:
      'Premium offer for teams or partner traffic with extra operational context.',
    scale_confirmation_note:
      'Expanded confirmation PDF with ops, legal, and audit-ready sections.',
    shared_scope_1: 'Route, departure time, and customer contact details',
    shared_scope_2: 'Trip price and payment method',
    shared_scope_3: 'Internal reference/order ID for tracking',
    growth_scope_1: 'Dedicated summary block for partner or dispatch teams',
    growth_scope_2: 'Service highlights and branded accent sections',
    scale_scope_1: 'Operations desk, service SLA, and premium support note',
    scale_scope_2: 'Audit-ready reference block and expanded terms summary',
    offer_term_1: 'Price and route are fixed at the moment this document is issued.',
    offer_term_2: 'Any address or schedule change may affect the final price.',
    offer_term_3: 'Booking becomes final after the trip details are confirmed.',
    confirmation_term_1: 'The transfer is confirmed for the agreed date, time, and route.',
    confirmation_term_2: 'The customer receives the service exactly as listed here.',
    confirmation_term_3: 'Changes after confirmation are processed as a separate request.',
    premium_term_1: 'Premium plan adds extra operational context for team workflows.',
    premium_term_2: 'This document is suitable for internal audit trail and partner handoff.',
    next_step_offer_1: 'Confirm the final route and day-of-trip contact details.',
    next_step_offer_2: 'Confirm payment method or settlement terms.',
    next_step_confirmation_1: 'Use the document reference for support or dispatch.',
    next_step_confirmation_2: 'Share the final confirmation copy with the customer.',
    support_note_starter: 'Booking questions are handled directly with the carrier.',
    support_note_growth: 'Growth PDF is additionally suitable for branded client handoff.',
    support_note_scale:
      'Scale PDF is designed for team workflows, audit, and premium support.',
  },
  cs: {
    app_name: 'TransferDocs',
    offer_title: 'Nabidka transferu',
    confirmation_title: 'Potvrzeni transferu',
    offer_subtitle:
      'PDF nabidka z durazem na trasu, cenu a rozsah sluzby pred finalnim potvrzenim.',
    confirmation_subtitle:
      'Potvrzene PDF s detaily jizdy, ucastniky a servisnimi podminkami.',
    plan: 'Plan',
    price: 'Cena',
    monthly_limit: 'Mesicni limit',
    document_quality: 'Uroven PDF',
    document_type: 'Typ dokumentu',
    customer: 'Klient',
    driver: 'Ridic',
    provider: 'Dopravce',
    pickup: 'Nastup',
    dropoff: 'Vystup',
    departure_time: 'Cas odjezdu',
    payment: 'Platba',
    total: 'Celkem',
    order_number: 'Cislo objednavky',
    issue_date: 'Datum vystaveni',
    valid_until: 'Platne do',
    trip_overview: 'Prehled jizdy',
    parties: 'Ucastnici',
    service_scope: 'Rozsah sluzby',
    service_terms: 'Servisni podminky',
    premium_operations: 'Premium operations',
    next_steps: 'Dalsi kroky',
    signatures: 'Podpisy',
    carrier_signature: 'Podpis dopravce',
    customer_signature: 'Podpis klienta',
    support: 'Podpora',
    reference_id: 'Reference ID',
    generated_by: 'Vygenerovano backendem TransferDocs',
    note: 'Poznamka',
    offer: 'Nabidka',
    confirmation: 'Potvrzeni',
    essential: 'Zakladni PDF',
    branded: 'Branded PDF',
    premium: 'Premium PDF',
    starter_offer_note:
      'Kratky offer balik pro rychle sladeni ceny, trasy a casu.',
    starter_confirmation_note:
      'Kompaktni potvrzeni pro soukromeho ridice nebo mensi denni provoz.',
    growth_offer_note:
      'Branded offer s rozsirenym summary pro stabilni operacni provoz.',
    growth_confirmation_note:
      'Detailnejsi potvrzeni se service highlights a readiness blockem.',
    scale_offer_note:
      'Premiovy offer pro tymovy nebo partnersky provoz s operacnim kontextem.',
    scale_confirmation_note:
      'Rozsirene confirmation PDF s ops, legal a audit-ready sekcemi.',
    shared_scope_1: 'Trasa, cas odjezdu a kontakt klienta',
    shared_scope_2: 'Cena jizdy a zpusob platby',
    shared_scope_3: 'Interni reference/order ID pro tracking',
    growth_scope_1: 'Samostatny summary blok pro partnera nebo dispatch',
    growth_scope_2: 'Service highlights a branded accent sekce',
    scale_scope_1: 'Operations desk, service SLA a premium support note',
    scale_scope_2: 'Audit-ready reference blok a rozsireny terms summary',
    offer_term_1: 'Cena a trasa jsou fixovany v okamziku vystaveni dokumentu.',
    offer_term_2: 'Zmena adresy nebo casu muze ovlivnit finalni cenu.',
    offer_term_3: 'Rezervace je finalni po potvrzeni detailu jizdy.',
    confirmation_term_1: 'Transfer je potvrzen na dohodnute datum, cas a trasu.',
    confirmation_term_2: 'Klient obdrzi sluzbu presne podle tohoto dokumentu.',
    confirmation_term_3: 'Zmeny po potvrzeni se resi jako samostatny pozadavek.',
    premium_term_1: 'Premium plan pridava operacni kontext pro tymovy workflow.',
    premium_term_2: 'Dokument je vhodny pro interni audit trail a partner handoff.',
    next_step_offer_1: 'Potvrdit finalni trasu a kontakt pro den jizdy.',
    next_step_offer_2: 'Potvrdit platbu nebo podminky vyuctovani.',
    next_step_confirmation_1: 'Pouzijte reference dokumentu pro support nebo dispatch.',
    next_step_confirmation_2: 'Sdilejte finalni confirmation copy s klientem.',
    support_note_starter: 'Dotazy k rezervaci se resi primo s dopravcem.',
    support_note_growth:
      'Growth PDF je navic vhodne pro branded predani klientovi.',
    support_note_scale:
      'Scale PDF je navrzene pro tymovy workflow, audit a premium support.',
  },
};

const THEME_TOKENS = {
  starter: {
    accent: '#b56e2d',
    accentSoft: '#f7eadc',
    accentStrong: '#7e4917',
    surface: '#fffaf5',
    border: '#e8c9aa',
    text: '#352416',
    muted: '#7c6b5c',
    hero: 'linear-gradient(135deg, rgba(181,110,45,0.18), rgba(255,255,255,0.88) 62%)',
  },
  growth: {
    accent: '#5d7590',
    accentSoft: '#e4edf7',
    accentStrong: '#30465f',
    surface: '#f8fbff',
    border: '#c8d6e5',
    text: '#1f3043',
    muted: '#5f7084',
    hero: 'linear-gradient(135deg, rgba(93,117,144,0.18), rgba(255,255,255,0.9) 62%)',
  },
  scale: {
    accent: '#c79a1d',
    accentSoft: '#fff3c7',
    accentStrong: '#7c5f12',
    surface: '#fffdf6',
    border: '#ead387',
    text: '#3c3214',
    muted: '#74663b',
    hero: 'linear-gradient(135deg, rgba(199,154,29,0.2), rgba(255,255,255,0.92) 60%)',
  },
};

function resolveLanguage(language) {
  return SUPPORTED_LANGUAGES.has(language) ? language : 'uk';
}

function translate(language, key) {
  return TRANSLATIONS[language]?.[key] || TRANSLATIONS.uk[key] || key;
}

function formatMessage(template, params = {}) {
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value ?? ''));
  }, template);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderMultilineText(value) {
  return escapeHtml(String(value || '-')).replaceAll('\n', '<br />');
}

function formatDate(value, language) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  const locale = language === 'en' ? 'en-GB' : language === 'cs' ? 'cs-CZ' : 'uk-UA';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatCurrency(value, language) {
  if (!Number.isFinite(Number(value))) return '-';

  const locale = language === 'en' ? 'en-GB' : language === 'cs' ? 'cs-CZ' : 'uk-UA';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function addDays(value, days) {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) return '';

  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function renderDefinitionGrid(items) {
  return items
    .map(
      item => `
        <div class="infoItem">
          <span class="infoLabel">${escapeHtml(item.label)}</span>
          <strong class="infoValue">${item.multiline ? renderMultilineText(item.value) : escapeHtml(item.value)}</strong>
        </div>
      `
    )
    .join('');
}

function renderList(items) {
  return items
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join('');
}

function buildPlanNote(planProfile, documentType, language) {
  const noteKey = `${planProfile}_${documentType}_note`;
  return translate(language, noteKey);
}

function buildScopeItems(planProfile, language) {
  const items = [
    translate(language, 'shared_scope_1'),
    translate(language, 'shared_scope_2'),
    translate(language, 'shared_scope_3'),
  ];

  if (planProfile === 'growth' || planProfile === 'scale') {
    items.push(translate(language, 'growth_scope_1'));
    items.push(translate(language, 'growth_scope_2'));
  }

  if (planProfile === 'scale') {
    items.push(translate(language, 'scale_scope_1'));
    items.push(translate(language, 'scale_scope_2'));
  }

  return items;
}

function buildTerms(planProfile, documentType, language) {
  const keys =
    documentType === 'offer'
      ? ['offer_term_1', 'offer_term_2', 'offer_term_3']
      : ['confirmation_term_1', 'confirmation_term_2', 'confirmation_term_3'];

  const items = keys.map(key => translate(language, key));

  if (planProfile === 'scale') {
    items.push(translate(language, 'premium_term_1'));
    items.push(translate(language, 'premium_term_2'));
  }

  return items;
}

function buildNextSteps(documentType, language) {
  const keys =
    documentType === 'offer'
      ? ['next_step_offer_1', 'next_step_offer_2']
      : ['next_step_confirmation_1', 'next_step_confirmation_2'];

  return keys.map(key => translate(language, key));
}

function buildSupportNote(planProfile, language) {
  if (planProfile === 'scale') {
    return translate(language, 'support_note_scale');
  }

  if (planProfile === 'growth') {
    return translate(language, 'support_note_growth');
  }

  return translate(language, 'support_note_starter');
}

function buildTripFacts(contractData, language) {
  return [
    {
      label: translate(language, 'pickup'),
      value: contractData?.trip?.from?.address || '-',
      multiline: true,
    },
    {
      label: translate(language, 'dropoff'),
      value: contractData?.trip?.to?.address || '-',
      multiline: true,
    },
    {
      label: translate(language, 'departure_time'),
      value: contractData?.trip?.time || '-',
    },
    {
      label: translate(language, 'payment'),
      value: contractData?.trip?.paymentMethod || '-',
    },
    {
      label: translate(language, 'total'),
      value: contractData?.totalPrice || '-',
    },
    {
      label: translate(language, 'order_number'),
      value: contractData?.orderNumber || '-',
    },
  ];
}

function buildPartyCards(contractData, language) {
  return [
    {
      title: translate(language, 'customer'),
      values: [
        contractData?.customer?.name || '-',
        contractData?.customer?.email || contractData?.customer?.phone || '-',
      ],
    },
    {
      title: translate(language, 'driver'),
      values: [
        contractData?.driver?.name || '-',
        contractData?.driver?.address || '-',
        contractData?.driver?.spz || '-',
      ],
    },
    {
      title: translate(language, 'provider'),
      values: [
        contractData?.provider?.name || '-',
        contractData?.provider?.address || '-',
        contractData?.provider?.ico || '-',
      ],
    },
  ];
}

function renderPartyCards(cards) {
  return cards
    .map(
      card => `
        <article class="partyCard">
          <p class="sectionEyebrow">${escapeHtml(card.title)}</p>
          <div class="partyCardBody">
            ${card.values
              .map(value => `<p>${renderMultilineText(value)}</p>`)
              .join('')}
          </div>
        </article>
      `
    )
    .join('');
}

function renderPremiumSection(planProfile, language, referenceId) {
  if (planProfile !== 'scale') return '';

  return `
    <section class="sheetSection sheetSection--full">
      <div class="sectionHeader">
        <p class="sectionEyebrow">${escapeHtml(translate(language, 'premium_operations'))}</p>
        <h2>${escapeHtml(translate(language, 'reference_id'))}</h2>
      </div>
      <div class="premiumGrid">
        <div class="premiumCard">
          <strong>${escapeHtml(referenceId)}</strong>
          <p>${escapeHtml(translate(language, 'premium_term_1'))}</p>
        </div>
        <div class="premiumCard">
          <strong>${escapeHtml(translate(language, 'support'))}</strong>
          <p>${escapeHtml(translate(language, 'premium_term_2'))}</p>
        </div>
      </div>
    </section>
  `;
}

export function renderContractPdfHtml({
  contractData = {},
  plan,
  documentType,
  language = 'uk',
}) {
  const resolvedLanguage = resolveLanguage(language);
  const planProfile = plan?.pdfProfile || 'starter';
  const planQuality = plan?.pdfQuality || 'essential';
  const theme = THEME_TOKENS[planProfile] || THEME_TOKENS.starter;
  const titleKey = documentType === 'offer' ? 'offer_title' : 'confirmation_title';
  const subtitleKey =
    documentType === 'offer' ? 'offer_subtitle' : 'confirmation_subtitle';
  const issueDate = contractData?.today || new Date().toISOString();
  const referenceId = `${contractData?.orderNumber || 'draft'}-${plan?.id || 'plan'}`;

  return `
    <!doctype html>
    <html lang="${resolvedLanguage}">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(translate(resolvedLanguage, titleKey))}</title>
        <style>
          :root {
            --accent: ${theme.accent};
            --accent-soft: ${theme.accentSoft};
            --accent-strong: ${theme.accentStrong};
            --surface: ${theme.surface};
            --border: ${theme.border};
            --text: ${theme.text};
            --muted: ${theme.muted};
            --hero: ${theme.hero};
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @page {
            size: A4;
            margin: 0;
          }

          body {
            margin: 0;
            color: var(--text);
            font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
            background: #ffffff;
          }

          .sheet {
            min-height: 100vh;
            padding: 18mm 16mm 16mm;
            background:
              radial-gradient(circle at top right, rgba(255,255,255,0.9), transparent 32%),
              var(--hero);
          }

          .hero {
            border: 1px solid var(--border);
            border-radius: 22px;
            background: rgba(255, 255, 255, 0.92);
            padding: 18px 18px 16px;
            box-shadow: 0 16px 36px rgba(18, 24, 32, 0.08);
          }

          .heroTop,
          .heroMeta,
          .heroStats,
          .infoGrid,
          .sheetGrid,
          .partyGrid,
          .premiumGrid,
          .signatureGrid {
            display: grid;
            gap: 12px;
          }

          .heroTop,
          .heroMeta {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .heroStats {
            margin-top: 16px;
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .sheetGrid {
            margin-top: 16px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sheetSection,
          .statCard,
          .partyCard,
          .premiumCard {
            border: 1px solid var(--border);
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.94);
          }

          .sheetSection,
          .partyCard,
          .premiumCard {
            padding: 16px;
          }

          .sheetSection--full {
            grid-column: 1 / -1;
          }

          .brandMark {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: var(--accent-strong);
            background: var(--accent-soft);
          }

          .hero h1,
          .sectionHeader h2 {
            margin: 0;
            letter-spacing: -0.03em;
          }

          .hero h1 {
            margin-top: 10px;
            font-size: 30px;
            line-height: 1.06;
          }

          .hero p,
          .partyCardBody p,
          .sectionCopy,
          .sheetList,
          .supportNote,
          .signatureLine,
          .premiumCard p {
            margin: 0;
            font-size: 12px;
            line-height: 1.55;
            color: var(--muted);
          }

          .heroSubtitle {
            margin-top: 8px;
            max-width: 640px;
          }

          .metaKey {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: var(--muted);
          }

          .metaValue,
          .statValue,
          .premiumCard strong {
            display: block;
            margin-top: 4px;
            font-weight: 700;
            color: var(--text);
          }

          .statCard {
            padding: 14px;
            background: rgba(255, 255, 255, 0.82);
          }

          .statValue {
            font-size: 18px;
            letter-spacing: -0.03em;
          }

          .sectionHeader {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 12px;
          }

          .sectionEyebrow {
            margin: 0 0 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: var(--accent-strong);
          }

          .infoGrid,
          .partyGrid,
          .signatureGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .premiumGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .infoItem {
            padding: 12px;
            border-radius: 14px;
            background: var(--surface);
          }

          .infoLabel {
            display: block;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--muted);
          }

          .infoValue {
            display: block;
            margin-top: 6px;
            font-size: 13px;
            line-height: 1.5;
            color: var(--text);
          }

          .partyCardBody {
            display: grid;
            gap: 5px;
          }

          .sheetList {
            padding-left: 18px;
          }

          .sheetList li + li {
            margin-top: 7px;
          }

          .signatureLine {
            min-height: 48px;
            padding-top: 28px;
            border-top: 1px solid var(--border);
            color: var(--text);
          }

          .supportNote {
            padding: 12px 14px;
            border-radius: 14px;
            background: var(--accent-soft);
            color: var(--accent-strong);
          }

          .footer {
            margin-top: 16px;
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 10px;
            color: var(--muted);
          }

          @media print {
            .sheetSection,
            .partyCard,
            .statCard,
            .premiumCard,
            .hero {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <section class="hero">
            <div class="heroTop">
              <div>
                <span class="brandMark">${escapeHtml(translate(resolvedLanguage, 'app_name'))}</span>
                <h1>${escapeHtml(translate(resolvedLanguage, titleKey))}</h1>
                <p class="heroSubtitle">${escapeHtml(translate(resolvedLanguage, subtitleKey))}</p>
              </div>
              <div class="heroMeta">
                ${renderDefinitionGrid([
                  {
                    label: translate(resolvedLanguage, 'issue_date'),
                    value: formatDate(issueDate, resolvedLanguage),
                  },
                  {
                    label: translate(resolvedLanguage, 'valid_until'),
                    value:
                      documentType === 'offer'
                        ? formatDate(addDays(issueDate, 7), resolvedLanguage)
                        : formatDate(issueDate, resolvedLanguage),
                  },
                  {
                    label: translate(resolvedLanguage, 'reference_id'),
                    value: referenceId,
                  },
                  {
                    label: translate(resolvedLanguage, 'note'),
                    value: buildPlanNote(planProfile, documentType, resolvedLanguage),
                    multiline: true,
                  },
                ])}
              </div>
            </div>

            <div class="heroStats">
              <article class="statCard">
                <span class="metaKey">${escapeHtml(translate(resolvedLanguage, 'plan'))}</span>
                <strong class="statValue">${escapeHtml(plan?.name || '-')}</strong>
              </article>
              <article class="statCard">
                <span class="metaKey">${escapeHtml(translate(resolvedLanguage, 'price'))}</span>
                <strong class="statValue">${escapeHtml(formatCurrency(plan?.priceCzk, resolvedLanguage))}</strong>
              </article>
              <article class="statCard">
                <span class="metaKey">${escapeHtml(translate(resolvedLanguage, 'monthly_limit'))}</span>
                <strong class="statValue">${escapeHtml(String(plan?.monthlyGenerationLimit || '-'))}</strong>
              </article>
              <article class="statCard">
                <span class="metaKey">${escapeHtml(translate(resolvedLanguage, 'document_quality'))}</span>
                <strong class="statValue">${escapeHtml(translate(resolvedLanguage, planQuality))}</strong>
              </article>
            </div>
          </section>

          <section class="sheetGrid">
            <section class="sheetSection">
              <div class="sectionHeader">
                <div>
                  <p class="sectionEyebrow">${escapeHtml(translate(resolvedLanguage, 'trip_overview'))}</p>
                  <h2>${escapeHtml(translate(resolvedLanguage, 'document_type'))}: ${escapeHtml(translate(resolvedLanguage, documentType))}</h2>
                </div>
              </div>
              <div class="infoGrid">
                ${renderDefinitionGrid(buildTripFacts(contractData, resolvedLanguage))}
              </div>
            </section>

            <section class="sheetSection">
              <div class="sectionHeader">
                <div>
                  <p class="sectionEyebrow">${escapeHtml(translate(resolvedLanguage, 'parties'))}</p>
                  <h2>${escapeHtml(contractData?.orderNumber || '-')}</h2>
                </div>
              </div>
              <div class="partyGrid">
                ${renderPartyCards(buildPartyCards(contractData, resolvedLanguage))}
              </div>
            </section>

            <section class="sheetSection">
              <div class="sectionHeader">
                <div>
                  <p class="sectionEyebrow">${escapeHtml(translate(resolvedLanguage, 'service_scope'))}</p>
                  <h2>${escapeHtml(plan?.name || '-')}</h2>
                </div>
              </div>
              <ul class="sheetList">
                ${renderList(buildScopeItems(planProfile, resolvedLanguage))}
              </ul>
            </section>

            <section class="sheetSection">
              <div class="sectionHeader">
                <div>
                  <p class="sectionEyebrow">${escapeHtml(translate(resolvedLanguage, 'service_terms'))}</p>
                  <h2>${escapeHtml(translate(resolvedLanguage, documentType === 'offer' ? 'offer' : 'confirmation'))}</h2>
                </div>
              </div>
              <ul class="sheetList">
                ${renderList(buildTerms(planProfile, documentType, resolvedLanguage))}
              </ul>
            </section>

            ${renderPremiumSection(planProfile, resolvedLanguage, referenceId)}

            <section class="sheetSection">
              <div class="sectionHeader">
                <div>
                  <p class="sectionEyebrow">${escapeHtml(translate(resolvedLanguage, 'next_steps'))}</p>
                  <h2>${escapeHtml(translate(resolvedLanguage, 'support'))}</h2>
                </div>
              </div>
              <ul class="sheetList">
                ${renderList(buildNextSteps(documentType, resolvedLanguage))}
              </ul>
              <p class="supportNote">${escapeHtml(buildSupportNote(planProfile, resolvedLanguage))}</p>
            </section>

            ${
              documentType === 'confirmation'
                ? `
                  <section class="sheetSection">
                    <div class="sectionHeader">
                      <div>
                        <p class="sectionEyebrow">${escapeHtml(translate(resolvedLanguage, 'signatures'))}</p>
                        <h2>${escapeHtml(translate(resolvedLanguage, 'confirmation_title'))}</h2>
                      </div>
                    </div>
                    <div class="signatureGrid">
                      <div class="signatureLine">${escapeHtml(translate(resolvedLanguage, 'carrier_signature'))}</div>
                      <div class="signatureLine">${escapeHtml(translate(resolvedLanguage, 'customer_signature'))}</div>
                      <div class="signatureLine">${escapeHtml(translate(resolvedLanguage, 'reference_id'))}: ${escapeHtml(referenceId)}</div>
                    </div>
                  </section>
                `
                : ''
            }
          </section>

          <footer class="footer">
            <span>${escapeHtml(translate(resolvedLanguage, 'generated_by'))}</span>
            <span>${escapeHtml(formatMessage('{label}: {value}', {
              label: translate(resolvedLanguage, 'reference_id'),
              value: referenceId,
            }))}</span>
          </footer>
        </main>
      </body>
    </html>
  `;
}

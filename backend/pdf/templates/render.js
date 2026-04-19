import { readFileSync } from "node:fs";

const DOCTRA_LOGO_SVG = readFileSync(
  new URL("../../../src/shared/assets/doctra-icon.svg", import.meta.url),
  "utf8",
);

const DOCTRA_LOGO_DATA_URI = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  DOCTRA_LOGO_SVG,
)}`;

function resolveLanguage() {
  return "cs";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeText(value, fallback = "—") {
  const text = String(value ?? "").trim();
  return text ? text : fallback;
}

function renderText(value, fallback = "—") {
  return escapeHtml(normalizeText(value, fallback));
}

function renderMultilineText(value, fallback = "—") {
  return renderText(value, fallback).replaceAll("\n", "<br />");
}

function getObjectValue(value, keys = ["address", "name", "value"]) {
  if (!value || typeof value !== "object") {
    return normalizeText(value);
  }

  for (const key of keys) {
    if (value[key]) {
      return normalizeText(value[key]);
    }
  }

  return "—";
}

function getTripAddress(value) {
  return getObjectValue(value, ["address", "name", "value"]);
}

function localDateOnly(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function normalizeDateOnly(value) {
  if (!value) {
    return localDateOnly();
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match) {
    return match[1];
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return localDateOnly(parsed);
  }

  return text;
}

function normalizeDateTime(value) {
  const text = String(value ?? "").trim();
  if (!text) return "—";

  const match = text.match(
    /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/,
  );

  if (match) {
    return match[2] ? `${match[1]} ${match[2]}` : match[1];
  }

  return text;
}

function buildDocumentHeading(documentType) {
  return documentType === "offer"
    ? "Nabídka přepravy osob"
    : "Smlouva o přepravě osob";
}

function buildDocumentTitle(documentType) {
  return documentType === "offer" ? "Přepravní nabídka" : "Přepravní smlouva";
}

function renderRows(rows) {
  return rows
    .map(
      (row) => `
        <p class="key">${escapeHtml(row.label)}</p>
        <p class="value${row.multiline ? " value--multiline" : ""}">${renderMultilineText(row.value)}</p>
      `,
    )
    .join("");
}

function buildContractCompany(contractData = {}) {
  const provider =
    contractData?.provider && typeof contractData.provider === "object"
      ? contractData.provider
      : {};
  const company =
    contractData?.company && typeof contractData.company === "object"
      ? contractData.company
      : {};

  return {
    name: normalizeText(company.name || provider.name || "DocTra", "DocTra"),
    email: normalizeText(company.email || "—"),
    phone: normalizeText(company.phone || "—"),
  };
}

function buildTripPaymentMethod(contractData = {}) {
  return normalizeText(
    contractData?.trip?.paymentMethod ||
      contractData?.paymentMethod ||
      "hotovost / kartou na místě",
    "hotovost / kartou na místě",
  );
}

function buildHeaderSubtitle(orderNumber, today) {
  return `
    <div class="muted">#<strong>${renderText(orderNumber, "—")}</strong></div>
    <div class="muted">Datum vystavení: <strong>${renderText(today)}</strong></div>
  `;
}

export function renderContractPdfHtml({
  contractData = {},
  plan,
  documentType,
  language = "uk",
}) {
  const resolvedLanguage = resolveLanguage(language);
  const resolvedDocumentType =
    documentType === "offer" ? "offer" : "confirmation";
  const orderNumber = normalizeText(contractData?.orderNumber || "—");
  const issueDate = normalizeDateOnly(contractData?.today || new Date());
  const company = buildContractCompany(contractData);
  const fullTitle = buildDocumentHeading(resolvedDocumentType);
  const pageTitle = buildDocumentTitle(resolvedDocumentType);

  const driverName = normalizeText(contractData?.driver?.name);
  const driverAddress = normalizeText(contractData?.driver?.address);
  const driverSpz = normalizeText(contractData?.driver?.spz);
  const driverIco = normalizeText(contractData?.driver?.ico);

  const providerName = normalizeText(contractData?.provider?.name);
  const providerAddress = normalizeText(contractData?.provider?.address);
  const providerIco = normalizeText(contractData?.provider?.ico);

  const customerName = normalizeText(contractData?.customer?.name);
  const customerEmail = normalizeText(
    contractData?.customer?.email || contractData?.customer?.phone,
  );

  const pickupAddress = getTripAddress(contractData?.trip?.from);
  const dropoffAddress = getTripAddress(contractData?.trip?.to);
  const tripTime = normalizeDateTime(contractData?.trip?.time);
  const totalPrice = normalizeText(contractData?.totalPrice);
  const paymentMethod = buildTripPaymentMethod(contractData);

  return `
    <!doctype html>
    <html lang="${escapeHtml(resolvedLanguage)}" style="background-color: #727272;">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(pageTitle)}</title>
        <style>
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @page {
            size: A4;
            margin: 0;
          }

          html {
            background: #727272;
          }

          body {
            width: 800px;
            height: 1145px;
            margin: 0 auto;
            background-color: #fff;
            position: relative;
            font-family: Arial, sans-serif;
            color: #111;
            padding: 40px 30px 30px 30px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }

          h1,
          h2,
          h3,
          p {
            padding: 0;
            margin: 0;
          }

          .logo {
            position: absolute;
            right: 50px;
            top: 20px;
          }

          .logoMark {
            width: 156px;
            height: 156px;
            border-radius: 50%;
            border: 2px solid #d8cb72;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }

          .logoMark img {
            width: 112px;
            height: 112px;
            display: block;
          }

          .contract {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .left-container {
            max-width: 70%;
          }

          .title {
            font-weight: 900;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 36px;
            line-height: 1.05;
            letter-spacing: -0.02em;
          }

          .muted {
            font-size: 12px;
            margin: 5px 25px;
            color: #444;
          }

          section {
            margin-top: 30px;
          }

          .subtitle {
            font-size: 18px;
            font-weight: 700;
            font-family: Georgia, "Times New Roman", serif;
          }

          .grid-1,
          .grid-2 {
            display: grid;
            grid-template-columns: 130px auto;
            gap: 0 10px;
            margin-top: 10px;
          }

          .grid-2 {
            grid-template-columns: 130px 220px;
          }

          .key,
          .value {
            height: auto;
            margin: 5px 0;
            padding-left: 10px;
            display: flex;
            align-items: flex-end;
          }

          .key {
            font-size: 14px;
            font-weight: 500;
            color: #111;
          }

          .value {
            font-size: 16px;
            color: #727272;
            font-weight: 500;
            border-bottom: 1px dashed;
            min-height: 24px;
          }

          .value--multiline {
            line-height: 1.35;
            align-items: flex-start;
            padding-bottom: 2px;
          }

          .contract-notice {
            margin-top: auto;
            font-size: 14px;
            color: #444;
            margin-top: 12px;
          }

          .date {
            width: 30%;
            margin: 50px 50px 0 auto;
          }

          .dateRow {
            display: flex;
            justify-content: flex-end;
            align-items: flex-end;
          }

          .dateRow .contract-notice {
            margin-top: 0;
            margin-right: 16px;
          }

          .dateRow .value {
            min-width: 100px;
          }

          .signatures {
            display: grid;
            justify-items: center;
            grid-template-columns: 1fr 1fr;
            gap: 0 50px;
            margin-top: 40px;
          }

          .signature {
            display: flex;
            align-items: center;
          }

          .signature .value {
            min-width: 120px;
            height: 15px;
            border-bottom: 2px solid;
            margin-left: 10px;
            padding: 0;
          }

          footer {
            margin-top: 15px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="logo">
          <div class="logoMark" aria-label="DocTra">
            <img src="${DOCTRA_LOGO_DATA_URI}" alt="DocTra" />
          </div>
        </div>

        <main class="contract">
          <div class="left-container">
            <div class="header">
              <h1 class="title">${escapeHtml(fullTitle)}</h1>
              ${buildHeaderSubtitle(orderNumber, issueDate)}
            </div>

            <section class="driver">
              <h2 class="subtitle">Přepravce / Řidič:</h2>
              <div class="grid-1">
                ${renderRows([
                  { label: "Jméno:", value: driverName },
                  { label: "Adresa:", value: driverAddress },
                  { label: "SPZ vozidla:", value: driverSpz },
                  { label: "IČ:", value: driverIco },
                ])}
              </div>
            </section>

            <section class="provider">
              <h2 class="subtitle">Zprostředkovatel (Poskytovatel služby):</h2>
              <div class="grid-1">
                ${renderRows([
                  { label: "Jméno / Název firmy:", value: providerName },
                  { label: "Adresa:", value: providerAddress },
                  { label: "IČ:", value: providerIco },
                ])}
              </div>
            </section>

            <section class="customer">
              <h2 class="subtitle">Objednatel / Cestující:</h2>
              <div class="grid-1">
                ${renderRows([
                  { label: "Jméno:", value: customerName },
                  { label: "E-mail, phone:", value: customerEmail },
                  { label: "E-mail, phone:", value: customerEmail },
                ])}
              </div>
            </section>

            <section class="trip">
              <h2 class="subtitle">Údaje o přepravě:</h2>
              <div class="grid-1">
                ${renderRows([
                  {
                    label: "Místo nástupu:",
                    value: pickupAddress,
                    multiline: true,
                  },
                  {
                    label: "Místo ukončení:",
                    value: dropoffAddress,
                    multiline: true,
                  },
                  { label: "Datum a čas:", value: tripTime },
                ])}
              </div>

              <div class="grid-1 grid-2" style="margin-top: 20px;">
                ${renderRows([
                  { label: "Cena:", value: totalPrice },
                  { label: "Způsob platby:", value: paymentMethod },
                ])}
              </div>
            </section>
          </div>

          <div class="bottomArea">
            <p class="contract-notice">Smlouva uzavřena dle § 21 odst. 5 zákona č. 111/1994 Sb., o silniční dopravě</p>

            <div class="date">
              <div class="dateRow">
                <p class="contract-notice">V Praze dne</p>
                <p class="value">${escapeHtml(issueDate)}</p>
              </div>
            </div>

            <div class="signatures">
              <div class="signature">
                <p class="contract-notice">Podpis přepravce:</p>
                <p class="value">${renderText(driverName)}</p>
              </div>
              <div class="signature">
                <p class="contract-notice">Podpis objednatele:</p>
                <p class="value">${renderText(customerName)}</p>
              </div>
            </div>

            <footer>
              ${escapeHtml(company.name)} — • — ${escapeHtml(company.email)} — • — ${escapeHtml(company.phone)}
            </footer>
          </div>
        </main>
      </body>
    </html>
  `;
}

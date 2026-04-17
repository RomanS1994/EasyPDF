import { existsSync } from "node:fs";

import puppeteer from "puppeteer";

let browserPromise = null;

function resolvePdfExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const fallbackPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];

  for (const fallbackPath of fallbackPaths) {
    if (existsSync(fallbackPath)) {
      return fallbackPath;
    }
  }

  return undefined;
}

async function launchPdfBrowser() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: resolvePdfExecutablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
        "--font-render-hinting=medium",
      ],
    });

    return browser;
  } catch (error) {
    browserPromise = null;
    throw new Error(
      `Failed to launch PDF renderer: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function getPdfBrowser() {
  if (!browserPromise) {
    browserPromise = launchPdfBrowser();
  }

  return browserPromise;
}

export async function renderPdfFromHtml(html) {
  const browser = await getPdfBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({
      width: 1240,
      height: 1754,
      deviceScaleFactor: 1,
    });

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    await page.emulateMediaType("print");

    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });

    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "14mm",
        left: "12mm",
      },
    });
  } finally {
    await page.close();
  }
}

export async function closePdfBrowser() {
  if (!browserPromise) return;

  const browser = await browserPromise.catch(() => null);
  browserPromise = null;

  if (browser) {
    await browser.close();
  }
}

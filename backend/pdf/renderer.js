import { existsSync } from "node:fs";

import puppeteer from "puppeteer";

let browserPromise = null;

function resolveBundledChromiumPath() {
  try {
    const executablePath = puppeteer.executablePath();
    if (executablePath && existsSync(executablePath)) {
      return executablePath;
    }
  } catch {
    // Ignore and fall back to other browser locations.
  }

  return undefined;
}

function resolveSystemBrowserPath() {
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

function resolveConfiguredBrowserPath() {
  const configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  return configuredPath && existsSync(configuredPath) ? configuredPath : undefined;
}

function resolvePdfExecutablePath({ preferBundledChromium = true } = {}) {
  const configuredPath = resolveConfiguredBrowserPath();
  if (configuredPath) {
    return configuredPath;
  }

  if (preferBundledChromium) {
    const bundledChromiumPath = resolveBundledChromiumPath();
    if (bundledChromiumPath) {
      return bundledChromiumPath;
    }

    return resolveSystemBrowserPath();
  }

  return resolveSystemBrowserPath() || resolveBundledChromiumPath();
}

function buildLaunchOptions({ preferBundledChromium = true } = {}) {
  const executablePath = resolvePdfExecutablePath({ preferBundledChromium });

  return {
    headless: 'new',
    ...(executablePath ? { executablePath } : {}),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  };
}

async function launchPdfBrowser() {
  const attempts = [
    buildLaunchOptions({ preferBundledChromium: true }),
    buildLaunchOptions({ preferBundledChromium: false }),
  ];

  let lastError = null;

  for (const options of attempts) {
    try {
      return await puppeteer.launch(options);
    } catch (error) {
      lastError = error;
    }
  }

  browserPromise = null;
  throw new Error(
    `Failed to launch PDF renderer: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
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

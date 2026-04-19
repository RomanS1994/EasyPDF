import chromium from "@sparticuz/chromium";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

let browserPromise = null;

function resolveLocalBrowserPath() {
  const configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (configuredPath && existsSync(configuredPath)) {
    return configuredPath;
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
    const useServerChromium = process.platform === "linux" || process.env.USE_SPARTICUZ_CHROMIUM === "1";
    const executablePath = useServerChromium
      ? await chromium.executablePath()
      : resolveLocalBrowserPath();

    if (!executablePath) {
      throw new Error("Could not find a local Chrome executable");
    }

    return await puppeteer.launch({
      args: useServerChromium
        ? puppeteer.defaultArgs({ args: chromium.args, headless: "shell" })
        : puppeteer.defaultArgs({ headless: "new" }),
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: useServerChromium ? "shell" : "new",
      ignoreHTTPSErrors: true,
    });
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

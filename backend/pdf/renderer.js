import puppeteer from 'puppeteer';

let browserPromise = null;

async function launchPdfBrowser() {
  try {
    return await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--font-render-hinting=medium',
      ],
    });
  } catch (error) {
    browserPromise = null;
    throw new Error(
      `Failed to launch PDF renderer: ${error instanceof Error ? error.message : String(error)}`
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
      waitUntil: 'networkidle0',
    });
    await page.emulateMediaType('print');
    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '12mm',
        right: '12mm',
        bottom: '14mm',
        left: '12mm',
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

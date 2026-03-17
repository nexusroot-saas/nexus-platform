import puppeteer from 'puppeteer';
import crypto from 'node:crypto';

let browser = null;

async function getBrowser() {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', // Obrigatório no Render
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Evita crash em containers com pouca RAM
      ],
    });
  }
  return browser;
}

// Renderiza HTML → Buffer PDF + SHA-256
export async function renderPdf(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    return { buffer, sha256 };
  } finally {
    await page.close(); // Sempre libera a page
  }
}

// Graceful shutdown
export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

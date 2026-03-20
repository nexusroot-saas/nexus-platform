// packages/legal-core/src/pdf.service.js
import puppeteer from 'puppeteer';

let browser = null; // cache global do browser (reutiliza para performance)

export async function renderPdf(htmlContent, options = {}) {
  if (!browser) {
    try {
      browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
        headless: 'new', // headless moderno (mais estável)
        timeout: 30000, // 30s para launch
      });
      console.log('Browser Puppeteer iniciado com sucesso');
    } catch (err) {
      console.error('Falha ao iniciar browser:', err.message);
      throw err;
    }
  }

  const page = await browser.newPage();

  try {
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      ...options,
    });

    return pdfBuffer.toString('base64'); // retorna base64 para fácil uso em API
  } finally {
    await page.close(); // sempre fecha a page, mesmo em erro
  }
}

export async function closeBrowser() {
  if (browser) {
    try {
      await browser.close();
      console.log('Browser Puppeteer fechado');
      browser = null;
    } catch (err) {
      console.error('Erro ao fechar browser:', err.message);
    }
  }
}

// test-pdf.js
import { renderPdf, closeBrowser } from './packages/legal-core/src/pdf.service.js';

async function main() {
  const html = `
    <html>
      <head><title>Teste Nexus PDF</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1>Teste de Geração de PDF</h1>
        <p>Data atual: {{data_atual}}</p>
        <p>Paciente: João da Silva</p>
        <p>Médico: Dr. Maria Oliveira - CRM: 12345-MS</p>
        <hr>
        <p>Este PDF foi gerado com sucesso pelo Puppeteer.</p>
      </body>
    </html>
  `;

  try {
    console.log('Iniciando geração de PDF...');
    const base64 = await renderPdf(html);
    console.log('PDF gerado com sucesso!');
    console.log('Comprimento do base64:', base64.length);
    console.log('Primeiros 100 chars do base64:', base64.substring(0, 100) + '...');

    // Opcional: salvar o PDF para visualizar
    const fs = await import('fs/promises');
    await fs.writeFile('teste-gerado.pdf', Buffer.from(base64, 'base64'));
    console.log('PDF salvo como teste-gerado.pdf → abra para conferir!');
  } catch (err) {
    console.error('Erro durante o teste:', err.message);
    console.error(err.stack);
  } finally {
    await closeBrowser(); // garante fechamento mesmo em erro
  }
}

main().catch(err => {
  console.error('Erro fatal no main:', err);
  process.exit(1);
});
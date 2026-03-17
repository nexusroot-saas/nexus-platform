import { renderPdf } from './packages/legal-core/src/pdf.service.js';

const html = `
<!DOCTYPE html>
<html>
<head><title>Teste</title></head>
<body>
  <h1>Template Teste</h1>
  <p>Paciente: João Silva</p>
</body>
</html>`;

renderPdf(html).then(({ buffer, sha256 }) => {
  console.log('PDF gerado:', buffer.length, 'bytes');
  console.log('SHA-256:', sha256);
  process.exit(0);
}).catch(console.error);

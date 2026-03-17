// Resolve tags {paciente.nome} → valores reais
export function resolveTags(html, context) {
  return html.replace(/\{([^}]+)\}/g, (match, key) => {
    const val = key.split('.').reduce((o, k) => o?.[k], context);
    return val !== undefined ? String(val) : '';
  });
}

/**
 * @nexus/ui-kit — Typography Tokens
 * Foco em legibilidade clínica — prontuários, laudos, relatórios
 */

export const fontFamily = {
  sans:  "'DM Sans', system-ui, sans-serif",
  mono:  "'DM Mono', 'Courier New', monospace",
  serif: "'Georgia', serif",
};

export const fontSize = {
  xs:   '12px',  // legendas, labels de campo
  sm:   '13px',  // texto secundário, badges
  base: '14px',  // corpo padrão
  md:   '15px',  // texto de destaque
  lg:   '16px',  // subtítulos
  xl:   '18px',  // títulos de seção
  '2xl': '20px', // títulos de página
  '3xl': '24px', // métricas / stat cards
  '4xl': '32px', // hero / valores grandes
};

export const fontWeight = {
  light:   300,
  regular: 400,
  medium:  500,
  semibold: 600,
};

export const lineHeight = {
  tight:   1.2,
  snug:    1.4,
  normal:  1.6,
  relaxed: 1.75,
};

export const letterSpacing = {
  tight:  '-0.5px',
  normal: '0px',
  wide:   '0.04em',
  wider:  '0.08em',
  widest: '0.12em',
};

// Variáveis CSS
export const typographyVars = `
  --font-sans: ${fontFamily.sans};
  --font-mono: ${fontFamily.mono};
  --text-xs:   ${fontSize.xs};
  --text-sm:   ${fontSize.sm};
  --text-base: ${fontSize.base};
  --text-md:   ${fontSize.md};
  --text-lg:   ${fontSize.lg};
  --text-xl:   ${fontSize.xl};
  --text-2xl:  ${fontSize['2xl']};
  --text-3xl:  ${fontSize['3xl']};
  --text-4xl:  ${fontSize['4xl']};
`.trim();

/**
 * @nexus/ui-kit — Color Tokens
 *
 * Dois níveis:
 *  - PRIMITIVE: valores fixos de cor (nunca usar diretamente nos componentes)
 *  - SEMANTIC:  variáveis CSS dinâmicas que mudam por submarca via classe no <body>
 */

// ── Paleta Primitiva ──────────────────────────────────────────────────────
export const primitive = {
  // Azul — NexusMed
  blue: {
    50: '#e8f0ff',
    100: '#b3ccff',
    200: '#80aaff',
    300: '#4d88ff',
    400: '#1a66ff',
    500: '#1a6cff', // base
    600: '#0056cc',
    700: '#0042a3',
    800: '#002e7a',
    900: '#001a52',
  },

  // Rosa — NexusClin
  pink: {
    50: '#fde8ef',
    100: '#f9b3cc',
    200: '#f580aa',
    300: '#f04d88',
    400: '#ec1a66',
    500: '#e8457a', // base
    600: '#c43368',
    700: '#9e2656',
    800: '#781a44',
    900: '#520d32',
  },

  // Verde — NexusOdonto
  green: {
    50: '#dcfce7',
    100: '#bbf7d0',
    200: '#86efac',
    300: '#4ade80',
    400: '#22c55e',
    500: '#16a34a', // base
    600: '#15803d',
    700: '#166534',
    800: '#14532d',
    900: '#052e16',
  },

  // Roxo — NexusLab
  purple: {
    50: '#ede9fe',
    100: '#ddd6fe',
    200: '#c4b5fd',
    300: '#a78bfa',
    400: '#8b5cf6',
    500: '#7c3aed', // base
    600: '#6d28d9',
    700: '#5b21b6',
    800: '#4c1d95',
    900: '#2e1065',
  },

  // Laranja — NexusIMG
  orange: {
    50: '#ffedd5',
    100: '#fed7aa',
    200: '#fdba74',
    300: '#fb923c',
    400: '#f97316',
    500: '#ea580c', // base
    600: '#c2410c',
    700: '#9a3412',
    800: '#7c2d12',
    900: '#431407',
  },

  // Teal — NexusAdm
  teal: {
    50: '#ccfbf1',
    100: '#99f6e4',
    200: '#5eead4',
    300: '#2dd4bf',
    400: '#14b8a6',
    500: '#0d9488', // base
    600: '#0f766e',
    700: '#115e59',
    800: '#134e4a',
    900: '#042f2e',
  },

  // Cinza — neutros
  gray: {
    50: '#f5f5f3',
    100: '#e8e8e5',
    200: '#d0d0cc',
    300: '#b0b0aa',
    400: '#888880',
    500: '#606058',
    600: '#484840',
    700: '#303028',
    800: '#1a1a18',
    900: '#0a0a08',
  },

  // Status
  success: '#16a34a',
  warning: '#d97706',
  danger:  '#dc2626',
  info:    '#0284c7',
};

// ── Tokens Semânticos (mapeamento para variáveis CSS) ─────────────────────
// Estes são os nomes que os componentes devem usar — NUNCA valores primitivos
export const semantic = {
  // Marca — muda por submarca
  brandPrimary:    'var(--color-brand-primary)',
  brandHover:      'var(--color-brand-hover)',
  brandSoft:       'var(--color-brand-soft)',
  brandText:       'var(--color-brand-text)',

  // Superfícies
  surfaceBg:       'var(--color-surface-bg)',
  surfaceCard:     'var(--color-surface-card)',
  surfaceAlt:      'var(--color-surface-alt)',

  // Texto
  textPrimary:     'var(--color-text-primary)',
  textSecondary:   'var(--color-text-secondary)',
  textTertiary:    'var(--color-text-tertiary)',

  // Bordas
  borderDefault:   'var(--color-border-default)',
  borderStrong:    'var(--color-border-strong)',

  // Ações — sempre as mesmas independente de tema
  actionSuccess:   'var(--color-action-success)',
  actionDanger:    'var(--color-action-danger)',
  actionWarning:   'var(--color-action-warning)',
  actionInfo:      'var(--color-action-info)',
};

// ── Mapa de submarca → cor primitiva base ─────────────────────────────────
export const brandMap = {
  MED:    { primary: primitive.blue[500],   hover: primitive.blue[600],   soft: primitive.blue[50] },
  CLIN:   { primary: primitive.pink[500],   hover: primitive.pink[600],   soft: primitive.pink[50] },
  ODONTO: { primary: primitive.green[500],  hover: primitive.green[600],  soft: primitive.green[50] },
  LAB:    { primary: primitive.purple[500], hover: primitive.purple[600], soft: primitive.purple[50] },
  IMG:    { primary: primitive.orange[500], hover: primitive.orange[600], soft: primitive.orange[50] },
  ADM:    { primary: primitive.teal[500],   hover: primitive.teal[600],   soft: primitive.teal[50] },
};

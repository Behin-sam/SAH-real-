/**
 * VALOR Design System & Theme Tokens
 * Ported from shishi-88/SAH_Veteran_Recovery for unified design language
 */

import { Platform } from 'react-native';

export const theme = {
  fonts: {
    heading: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    body: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    mono: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 26,
    hero: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  colors: {
    // Shortcuts for convenience
    sand: '#FDF6EE',
    creamBg: '#FDF6EE',
    white: '#FFFFFF',
    border: '#E8DCCE',
    muted: '#786F68',
    rustColor: '#D96B27',
    espressoColor: '#1C1917',
    primary: '#D96B27',
    secondary: '#8C4A1E',
    background: '#FDF6EE',
    card: '#FFFFFF',
    text: '#1C1917',

    // Warm Cream Canvas & Surfaces
    cream: {
      50: '#FFFFFF',
      100: '#FFFDF9',
      200: '#FDF6EE', // Primary App Background
      300: '#F5EBE0',
      400: '#E8DCCE', // Borders & Dividers
      500: '#D6C4B0',
    },

    // Rust Primary Accent
    rust: {
      50: '#FDF3ED',
      100: '#FBE4D6',
      200: '#F7C4A7',
      300: '#F09D70',
      400: '#E67A3D',
      500: '#D96B27', // Primary Accent (Buttons, Active Tabs, Badges)
      600: '#C55A1A',
      700: '#A14412',
      800: '#7E3411',
      900: '#5C250E',
    },

    // Warm Peach Secondary & Badges
    peach: {
      100: '#FDF2E9',
      200: '#F7DFCC', // Pill Badge Background
      300: '#EEBD9B',
      800: '#8C4A1E', // Pill Badge Text
    },

    // Deep Espresso Typography & High-Contrast
    espresso: {
      100: '#E7E5E4',
      400: '#786F68', // Muted / Secondary Text
      700: '#44403C',
      800: '#282524',
      900: '#1C1917', // Primary Headings & Dark Elements
      950: '#141211',
    },

    // Semantic Status Colors
    status: {
      stable: '#059669', // Sage / Emerald Green
      attention: '#D97706', // Warm Amber
      urgent: '#DC2626', // Crimson SOS Red
      info: '#D96B27', // Warm Rust
    },
  },

  // Shadows
  shadows: {
    card: {
      shadowColor: '#282524',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    warm: {
      shadowColor: '#282524',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    warmMd: {
      shadowColor: '#282524',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 4,
    },
    rustGlow: {
      shadowColor: '#D96B27',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
  },

  // Typography helpers
  typography: {
    heading: {
      fontWeight: '800',
      letterSpacing: -0.5,
      color: '#1C1917',
    },
    overline: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: '#786F68',
    },
    body: {
      fontSize: 14,
      color: '#1C1917',
    },
    muted: {
      fontSize: 12,
      color: '#786F68',
    },
  },

  // Standard component surface presets
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DCCE',
    padding: 16,
  },

  badgePeach: {
    backgroundColor: '#F7DFCC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePeachText: {
    color: '#8C4A1E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  badgeRust: {
    backgroundColor: '#D96B27',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeRustText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
};

// theme.ts
import { vars } from 'nativewind';

// ============================================================================
// FONT CONFIGURATION
// ============================================================================
// Each theme can define its own font families. Fonts are loaded in _layout.tsx
// using expo-font and referenced via CSS variables in tailwind.config.js.
//
// Font families:
// - heading: Used for h1-h4 headings
// - body: Used for body text, labels, captions
// - mono: Used for code snippets
// ============================================================================

export interface ThemeFonts {
  heading: {
    family: string;
    weights: Record<string, string>; // weight name -> font file key
  };
  body: {
    family: string;
    weights: Record<string, string>;
  };
  mono: {
    family: string;
    weights: Record<string, string>;
  };
}

// Default theme fonts: Inter for clean, modern typography
export const themeFonts: ThemeFonts = {
  heading: {
    family: 'Inter',
    weights: {
      normal: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    },
  },
  body: {
    family: 'Inter',
    weights: {
      normal: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
    },
  },
  mono: {
    family: 'JetBrainsMono',
    weights: {
      normal: 'JetBrainsMono_400Regular',
      medium: 'JetBrainsMono_500Medium',
    },
  },
};

// Energetic fitness theme with bold colors - IRONLOG PRO
export const lightTheme = vars({
  '--radius': '16', // More rounded for modern iOS feel

  // Core semantic colors - Clean whites with strong contrast
  '--background': '250 250 250',
  '--foreground': '15 15 15',

  '--card': '255 255 255',
  '--card-foreground': '15 15 15',

  '--popover': '255 255 255',
  '--popover-foreground': '15 15 15',

  // Primary - Vibrant lime green for fitness energy
  '--primary': '132 204 22',
  '--primary-foreground': '15 15 15',

  // Secondary - Soft gray
  '--secondary': '241 245 249',
  '--secondary-foreground': '15 15 15',

  // Muted - Subtle backgrounds
  '--muted': '241 245 249',
  '--muted-foreground': '100 116 139',

  // Accent - Electric teal for variety
  '--accent': '20 184 166',
  '--accent-foreground': '255 255 255',

  '--destructive': '239 68 68',

  // Borders and inputs
  '--border': '226 232 240',
  '--input': '241 245 249',
  '--ring': '132 204 22',

  // Chart colors - Fitness themed gradient palette
  '--chart-1': '132 204 22', // Lime (primary)
  '--chart-2': '20 184 166', // Teal
  '--chart-3': '245 158 11', // Amber
  '--chart-4': '239 68 68', // Red
  '--chart-5': '139 92 246', // Violet

  // Sidebar colors
  '--sidebar': '255 255 255',
  '--sidebar-foreground': '15 15 15',
  '--sidebar-primary': '132 204 22',
  '--sidebar-primary-foreground': '15 15 15',
  '--sidebar-accent': '241 245 249',
  '--sidebar-accent-foreground': '15 15 15',
  '--sidebar-border': '226 232 240',
  '--sidebar-ring': '132 204 22',
});

export const darkTheme = vars({
  '--radius': '16',

  // Core semantic colors - Deep charcoal for premium feel
  '--background': '10 10 10',
  '--foreground': '250 250 250',

  '--card': '22 22 22',
  '--card-foreground': '250 250 250',

  '--popover': '28 28 28',
  '--popover-foreground': '250 250 250',

  // Primary - Vibrant lime stays consistent
  '--primary': '163 230 53',
  '--primary-foreground': '10 10 10',

  // Secondary
  '--secondary': '38 38 38',
  '--secondary-foreground': '250 250 250',

  // Muted
  '--muted': '38 38 38',
  '--muted-foreground': '148 163 184',

  // Accent - Electric teal
  '--accent': '45 212 191',
  '--accent-foreground': '10 10 10',

  '--destructive': '248 113 113',

  // Borders and inputs
  '--border': '38 38 38',
  '--input': '38 38 38',
  '--ring': '163 230 53',

  // Chart colors - Vibrant on dark
  '--chart-1': '163 230 53', // Lime
  '--chart-2': '45 212 191', // Teal
  '--chart-3': '251 191 36', // Amber
  '--chart-4': '248 113 113', // Red
  '--chart-5': '167 139 250', // Violet

  // Sidebar colors
  '--sidebar': '18 18 18',
  '--sidebar-foreground': '250 250 250',
  '--sidebar-primary': '163 230 53',
  '--sidebar-primary-foreground': '10 10 10',
  '--sidebar-accent': '38 38 38',
  '--sidebar-accent-foreground': '250 250 250',
  '--sidebar-border': '38 38 38',
  '--sidebar-ring': '163 230 53',
});

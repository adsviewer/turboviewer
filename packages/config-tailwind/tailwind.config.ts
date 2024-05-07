import type { Config } from 'tailwindcss';

// We want each package to be responsible for its own content.
const config: Omit<Config, 'content'> = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        faint: {
          DEFAULT: 'rgb(var(--faint) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        menu: {
          DEFAULT: 'rgb(var(--color-menu) / <alpha-value>)',
          bg: 'rgb(var(--color-menu) / <alpha-value>)',
          primary: 'rgb(var(--color-menu-primary) / <alpha-value>)',
        },
        tooltip: {
          DEFAULT: 'rgb(var(--tooltip) / <alpha-value>)',
          bg: 'rgb(var(--tooltip-background) / <alpha-value>)',
        },
      },
      backgroundImage: {
        'glow-conic': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)',
      },
    },
  },
  plugins: [],
};
export default config;

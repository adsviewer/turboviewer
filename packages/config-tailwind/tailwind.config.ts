import type { Config } from 'tailwindcss';

// We want each package to be responsible for its own content.
const config: Omit<Config, 'content'> = {
  theme: {
    extend: {
      colors: {
        primary: '#43A047',
        secondary: '#a853ba',
        destructive: {
          DEFAULT: 'hsl(0 62.8% 30.6%)',
          foreground: 'hsl(210 40% 98%)',
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

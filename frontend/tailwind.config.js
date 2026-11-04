/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7', // Core brand primary
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 20px -2px rgba(2, 132, 199, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'hover': '0 10px 25px -3px rgba(2, 132, 199, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}

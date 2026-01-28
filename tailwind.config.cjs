module.exports = {
  content: ['./src/**/*.{astro,js,ts,svelte}'],
  theme: {
    extend: {
      colors: {
        tapete: {
          50: '#f3faf7',
          100: '#dff3ec',
          500: '#0b6a57',
          700: '#08332a',
          900: '#042f2e'
        },
        wood: {
          100: '#efe1d2',
          300: '#ddbfa6',
          500: '#7a4b2a',
          700: '#4b2e1a'
        },
        panel: {
          50: '#fffaf2',
          100: '#fff3e6',
          500: '#f3efe6',
          700: '#0b2b23'
        },
        brand: {
          500: '#0ea5a0',
          700: '#0a7f78'
        },
        accent: {
          500: '#f59e0b',
          700: '#d97706'
        }
      },
      boxShadow: {
        'card-md': '0 8px 18px rgba(2,6,23,0.08)',
        'inset-lg': 'inset 0 -6px 12px rgba(0,0,0,0.12)'
      }
    },
  },
  plugins: [],
};

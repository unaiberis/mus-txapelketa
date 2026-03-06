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
        },
        'primary-50': '#ecfdf3',
        'primary-500': '#117a3a',
        'primary-700': '#0a5a2b',
        'accent-400': '#D4AF37',
        'accent-600': '#b8912a',
        'neutral-50': '#fafafa',
        'neutral-100': '#f3f4f6',
        'neutral-300': '#d1d5db',
        'neutral-700': '#374151',
        'neutral-900': '#0f172a',
        'card-bg': '#032a18',
        'surface-100': '#0b3b25',
        'border-200': '#2f4f3a',
        'success-500': '#16a34a',
        'danger-500': '#ef4444'
      },
      spacing: {
        'space-1': '0.25rem',
        'space-2': '0.5rem',
        'space-3': '0.75rem',
        'space-4': '1rem',
        'space-6': '1.5rem',
        'space-8': '2rem'
      },
      borderRadius: {
        'card': '0.5rem',
        'lg': '0.75rem',
        'pill': '9999px'
      },
      boxShadow: {
        'card-md': '0 8px 18px rgba(2,6,23,0.08)',
        'inset-lg': 'inset 0 -6px 12px rgba(0,0,0,0.12)',
        'table-sm': '0 1px 2px rgba(2,6,23,0.4)',
        'table-md': '0 4px 12px rgba(2,6,23,0.55)'
      }
    ,
    backgroundImage: {
      'linen': "url('/textures/linen.svg')",
      'wood': "linear-gradient(180deg, rgba(218,189,148,0.12), rgba(210,180,140,0.06))"
    }
    },
  },
  plugins: [],
};

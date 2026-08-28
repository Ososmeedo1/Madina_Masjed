module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--c-surf) / <alpha-value>)',
          dim: 'rgb(var(--c-surf-dim) / <alpha-value>)',
          bright: 'rgb(var(--c-surf-br) / <alpha-value>)',
          variant: 'rgb(var(--c-surf-var) / <alpha-value>)',
          container: {
            lowest: 'rgb(var(--c-scl) / <alpha-value>)',
            low: 'rgb(var(--c-sclow) / <alpha-value>)',
            DEFAULT: 'rgb(var(--c-scd) / <alpha-value>)',
            high: 'rgb(var(--c-sch) / <alpha-value>)',
            highest: 'rgb(var(--c-schg) / <alpha-value>)',
          },
        },
        'on-surface': {
          DEFAULT: 'rgb(var(--c-ons) / <alpha-value>)',
          variant: 'rgb(var(--c-onsv) / <alpha-value>)',
        },
        outline: {
          DEFAULT: 'rgb(var(--c-out) / <alpha-value>)',
          variant: 'rgb(var(--c-outv) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--c-pri) / <alpha-value>)',
          container: 'rgb(var(--c-pri-c) / <alpha-value>)',
          fixed: 'rgb(var(--c-pfix) / <alpha-value>)',
          fixedDim: 'rgb(var(--c-pfix-dim) / <alpha-value>)',
        },
        'on-primary': {
          DEFAULT: 'rgb(var(--c-onpri) / <alpha-value>)',
          container: 'rgb(var(--c-onpfix-var) / <alpha-value>)',
          fixed: 'rgb(var(--c-onpfix) / <alpha-value>)',
          fixedVariant: 'rgb(var(--c-onpfix-var) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--c-sec) / <alpha-value>)',
          container: 'rgb(var(--c-sec-c) / <alpha-value>)',
          fixed: 'rgb(var(--c-sfix) / <alpha-value>)',
          fixedDim: 'rgb(var(--c-sfix-dim) / <alpha-value>)',
        },
        'on-secondary': {
          DEFAULT: 'rgb(var(--c-onsfix) / <alpha-value>)',
          container: 'rgb(var(--c-onsfix) / <alpha-value>)',
          fixed: 'rgb(var(--c-onsfix) / <alpha-value>)',
          fixedVariant: 'rgb(var(--c-onsfix-var) / <alpha-value>)',
        },
        tertiary: {
          DEFAULT: 'rgb(var(--c-ter) / <alpha-value>)',
          container: 'rgb(var(--c-ter-c) / <alpha-value>)',
        },
        'on-tertiary': {
          DEFAULT: 'rgb(var(--c-on-ter) / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(var(--c-err) / <alpha-value>)',
          container: 'rgb(var(--c-errc) / <alpha-value>)',
        },
        'on-error': {
          DEFAULT: 'rgb(var(--c-oerr) / <alpha-value>)',
          container: 'rgb(var(--c-oerrc) / <alpha-value>)',
        },
      },
      fontFamily: {
        amiri: ['Amiri', 'Scheherazade New', 'Traditional Arabic', 'serif'],
        sans: ['"Noto Sans Arabic"', 'Tahoma', 'Arial', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', '"Noto Sans Arabic"', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 2px 16px rgb(var(--sc) / 0.30)',
        raised: '0 6px 24px rgb(var(--sc) / 0.40)',
        pressed: '0 1px 4px rgb(var(--sc) / 0.35)',
      },
      maxWidth: {
        content: '1140px',
      },
      keyframes: {
        'row-new': {
          '0%': { backgroundColor: 'rgb(var(--c-pfix) / 0.55)', transform: 'translateY(-3px)' },
          '100%': { backgroundColor: 'transparent', transform: 'none' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'row-new': 'row-new 2.4s ease-out',
        'fade-in': 'fade-in 0.35s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

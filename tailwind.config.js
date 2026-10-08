/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

// Phone held sideways: short and not desktop-wide. Kept mutually exclusive with `lg`
// so landscape overrides never fight desktop ones. Mirrored in src/lib/layout.js.
export const LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 540px) and (max-width: 1023px)';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Touch devices don't get "stuck" hover styles after a tap.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      screens: {
        land: { raw: LANDSCAPE_QUERY },
      },
      colors: {
        bg: token('bg'),
        'bg-2': token('bg-2'),
        surface: token('surface'),
        accent: token('accent'),
        'accent-2': token('accent-2'),
        ink: token('text'),
        muted: token('muted'),
        line: token('line'),
        warn: token('warn'),
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.2' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
      animation: {
        blink: 'blink 1.4s steps(2, start) infinite',
        scan: 'scan 6s linear infinite',
      },
    },
  },
  plugins: [],
};

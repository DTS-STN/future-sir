import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  content: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    // @see https://wet-boew.github.io/wet-boew-styleguide/design/grids-en.html#responsive
    screens: {
      sm: '768px',
      md: '992px',
      lg: '1200px',
      print: { raw: 'print' },
      screen: { raw: 'screen' },
    },
    extend: {
      backgroundImage: () => ({
        'splash-page': 'url(https://www.canada.ca/content/dam/canada/splash/sp-bg-1.jpg)',
      }),
      fontFamily: {
        lato: ['"Lato"', 'sans-serif'],
        sans: ['"Noto Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        navy: {
          50: '#EBF2FC',
          100: '#B5D4F4',
          600: '#185FA5',
          700: '#1A3A5C',
          800: '#0C447C',
          900: '#042C53',
        },
      },
    },
  },
  plugins: [],
}

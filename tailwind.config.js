/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        prompt: ['Prompt', 'Sarabun', 'system-ui', 'sans-serif'],
        sarabun: ['Sarabun', 'system-ui', 'sans-serif']
      },
      colors: {
        hospital: {
          blue: '#1262A3',
          navy: '#0B416C',
          teal: '#0F9F9A',
          mist: '#EEF8FB',
          line: '#D7E6EE'
        }
      },
      boxShadow: {
        panel: '0 18px 50px rgba(16, 42, 67, 0.10)'
      }
    }
  },
  plugins: []
};

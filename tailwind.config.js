/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        kite: {
          bg: '#1c1c1c',
          'bg-darker': '#121212',
          surface: '#242424',
          'surface-hover': '#2a2a2a',
          border: '#2c2c2c',
          'border-light': '#3c3c3c',
          accent: '#ff5722',
          'accent-hover': '#ff7043',
          green: '#4caf50',
          'green-light': '#81c784',
          red: '#f44336',
          'red-light': '#e57373',
          blue: '#2196f3',
          'blue-hover': '#42a5f5',
          yellow: '#ffeb3b',
          text: '#ffffff',
          'text-muted': '#9e9e9e',
          'text-dim': '#666666',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'flash-green': 'flashGreen 0.5s ease-out',
        'flash-red': 'flashRed 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        flashGreen: {
          '0%': { backgroundColor: 'rgba(76, 175, 80, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashRed: {
          '0%': { backgroundColor: 'rgba(244, 67, 54, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 8px 40px rgba(0, 0, 0, 0.2)',
        'glow-green': '0 0 20px rgba(76, 175, 80, 0.3)',
        'glow-red': '0 0 20px rgba(244, 67, 54, 0.3)',
        'glow-blue': '0 0 20px rgba(33, 150, 243, 0.3)',
      },
    },
  },
  plugins: [],
}

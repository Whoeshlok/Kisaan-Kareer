/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          950: "var(--green-950)",
          900: "var(--green-900)",
          800: "var(--green-800)",
          600: "var(--green-600)",
          200: "var(--green-200)",
          100: "var(--green-100)",
        },
        clay: {
          500: "var(--clay-500)",
          100: "var(--clay-100)",
        },
        gold: {
          500: "var(--gold-500)",
          100: "var(--gold-100)",
        },
        sky: {
          500: "var(--sky-500)",
          100: "var(--sky-100)",
        },
        cream: {
          50: "var(--cream-50)",
          100: "var(--cream-100)",
        },
        paper: "var(--paper)",
        ink: {
          900: "var(--ink-900)",
          600: "var(--ink-600)",
          400: "var(--ink-400)",
        },
        line: "var(--line)",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
    },
  },
  plugins: [],
};

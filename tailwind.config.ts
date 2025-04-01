import type { Config } from "tailwindcss";

export default {
    darkMode: "class",
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			white: 'var(--white)',
  			background: 'var(--background)',
  			primary: 'var(--primary)',
  			secondary: 'var(--secondary)',
  			lightGray: 'var(--gray-300)',
  			darkGray: 'var(--gray-700)',
			toggleBackground: 'var(--toggleBackground)',
			backgroundColor: 'var(--backgroundColor)',
			blue50: 'var(--blue-50)',
			blue100: 'var(--blue-100)',
			blue200: 'var(--blue-200)',
			gray50: 'var(--gray-50)',
			gray100: 'var(--gray-100)',
			gray200: 'var(--gray-200)',
			gray400: 'var(--gray-400)',
			gray500: 'var(--gray-500)',
			gray600: 'var(--gray-600)',
			gray700: 'var(--gray-700)',
			slate100: 'var(--slate-100)',

  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

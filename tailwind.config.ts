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
			greySubText: 'var(--grey-600)',
			toggleBackground: 'var(--toggleBackground)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

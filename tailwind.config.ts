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
		backdropBlur: {
			'xs': '2px',
			'sm': '4px',
			'md': '8px',
			'lg': '12px',
			'xl': '16px',
			'2xl': '24px',
			'3xl': '40px',
		},
		backgroundColor: {
			'glass-transparent': 'rgba(255, 255, 255, 0.05)',
			'glass-transparent-dark': 'rgba(0, 0, 0, 0.05)',
			
			'glass-frosted': 'rgba(255, 255, 255, 0.15)',
			'glass-frosted-dark': 'rgba(0, 0, 0, 0.15)',
		},
		borderColor: {
			'glass-border': 'rgba(255, 255, 255, 0)',
			'glass-border-dark': 'rgba(255, 255, 255, 0.1)',
		}
  	}
  },
  plugins: [
	require("tailwindcss-animate"),
	function({ addUtilities }: { addUtilities: any }) {
		const glassUtilities = {
			'.glass-transparent': {
				'background': 'rgba(255, 255, 255, 0.05)',
				'backdrop-filter': 'blur(4px)',
				'border': '1px solid rgba(255, 255, 255, 0.1)',
			},
			'.dark .glass-transparent': {
				'background': 'rgba(0, 0, 0, 0.05)',
				'border': '1px solid rgba(255, 255, 255, 0.05)',
			},
			
			'.glass-frosted': {
				'background': 'rgba(255, 255, 255, 0.15)',
				'backdrop-filter': 'blur(8px)',
				'border': '1px solid rgba(255, 255, 255, 0.2)',
			},
			'.dark .glass-frosted': {
				'background': 'rgba(0, 0, 0, 0.15)',
				'border': '1px solid rgba(255, 255, 255, 0.1)',
			},
			
			'.glass-card': {
				'background': 'rgba(255, 255, 255, 0.15)',
				'backdrop-filter': 'blur(8px)',
				'border': '1px solid rgba(255, 255, 255, 0.2)',
				'border-radius': '12px',
				'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.1)',
			},
			'.dark .glass-card': {
				'background': 'rgba(0, 0, 0, 0.15)',
				'border': '1px solid rgba(255, 255, 255, 0.1)',
				'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.3)',
			},
			
			'.glass-panel': {
				'background': 'rgba(255, 255, 255, 0.1)',
				'backdrop-filter': 'blur(10px)',
				'border': '1px solid rgba(255, 255, 255, 0.0)',
				'border-radius': '16px',
				'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.08)',
			},
			'.dark .glass-panel': {
				'background': 'rgba(0, 0, 0, 0.1)',
				'border': '1px solid rgba(255, 255, 255, 0.08)',
				'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.25)',
			},
					
			'.glass-panel-visible': {
				'background': 'rgba(255, 255, 255, 0.3)',
				'backdrop-filter': 'blur(6px)',
				'border': '1px solid rgba(255, 255, 255, 0.3)',
				'border-radius': '16px',
				'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.12)',
			},
			'.dark .glass-panel-visible': {
				'background': 'rgba(0, 0, 0, 0.25)',
				'border': '1px solid rgba(255, 255, 255, 0.15)',
				'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.35)',
			},
			
			'.glass-light': {
				'background': 'rgba(255, 255, 255, 0.2)',
				'backdrop-filter': 'blur(6px)',
				'border': '1px solid rgba(0, 0, 0, 0.12)',
			},
			'.dark .glass-light': {
				'background': 'rgba(0, 0, 0, 0.2)',
				'border': '1px solid rgba(255, 255, 255, 0.12)',
			},
			
			'.glass-card-visible': {
				'background': 'rgba(255, 255, 255, 0.4)',
				'backdrop-filter': 'blur(6px)',
				'border': '1px solid rgba(255, 255, 255, 0.3)',
				'border-radius': '12px',
				'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.1)',
			},
			'.dark .glass-card-visible': {
				'background': 'rgba(0, 0, 0, 0.2)',
				'border': '1px solid rgba(255, 255, 255, 0.15)',
				'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.3)',
			},
		};
		
		addUtilities(glassUtilities);
	}
  ],
} satisfies Config;

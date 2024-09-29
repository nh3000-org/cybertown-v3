/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				bg: 'rgb(var(--bg) / 1)',
				'bg-2': 'rgb(var(--bg-2) / 1)',
				fg: 'rgb(var(--fg) / 1)',
				border: 'rgb(var(--border) / 1)',
				muted: 'rgb(var(--muted) / 1)',
				danger: 'rgb(var(--danger) / 1)',
				scrollbar: 'rgb(var(--scrollbar) / 1)',
				overlay: 'rgb(var(--overlay) / 0.5)',
				brand: {
					DEFAULT: 'rgb(var(--brand) / 1)',
					fg: 'rgb(var(--brand-fg) / 1)',
				},
				accent: 'rgb(var(--accent) / 1)',
			},
		},
	},
}

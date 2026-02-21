/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "1rem",
            screens: {
                sm: "640px",
                md: "768px",
                lg: "1024px",
                xl: "1280px",
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                warning: {
                    DEFAULT: "hsl(var(--warning))",
                    foreground: "hsl(var(--warning-foreground))",
                },
                success: {
                    DEFAULT: "hsl(var(--success))",
                    foreground: "hsl(var(--success-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                /* Healthcare palette */
                medical: {
                    teal: {
                        50: '#effcf9',
                        100: '#c7f7eb',
                        200: '#8fefda',
                        300: '#4fdfc3',
                        400: '#1cc8a9',
                        500: '#0ea58f',
                        600: '#098474',
                        700: '#0b6a5e',
                        800: '#0e544d',
                        900: '#0f4540',
                    },
                    blue: {
                        50: '#eff6ff',
                        100: '#dbeafe',
                        200: '#bfdbfe',
                        300: '#93c5fd',
                        400: '#60a5fa',
                        500: '#3b82f6',
                        600: '#2563eb',
                    },
                    cyan: {
                        50: '#ecfeff',
                        100: '#cffafe',
                        200: '#a5f3fc',
                        300: '#67e8f9',
                        400: '#22d3ee',
                        500: '#06b6d4',
                    },
                    purple: {
                        50: '#faf5ff',
                        100: '#f3e8ff',
                        200: '#e9d5ff',
                        300: '#d8b4fe',
                        400: '#c084fc',
                        500: '#a855f7',
                    },
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl: "1rem",
                "2xl": "1.5rem",
                "3xl": "2rem",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
                display: ["Manrope", "Inter", "system-ui", "sans-serif"],
            },
            fontSize: {
                "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
            },
            spacing: {
                "safe-top": "env(safe-area-inset-top)",
                "safe-bottom": "env(safe-area-inset-bottom)",
                "safe-left": "env(safe-area-inset-left)",
                "safe-right": "env(safe-area-inset-right)",
            },
            minHeight: {
                "touch": "48px",
                "screen-safe": "calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
            },
            minWidth: {
                "touch": "48px",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
                "fade-in": {
                    from: { opacity: 0, transform: "translateY(10px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                },
                "slide-up": {
                    from: { opacity: 0, transform: "translateY(20px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                },
                "slide-down": {
                    from: { opacity: 0, transform: "translateY(-10px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                },
                "scale-in": {
                    from: { opacity: 0, transform: "scale(0.95)" },
                    to: { opacity: 1, transform: "scale(1)" },
                },
                "pop-in": {
                    "0%": { opacity: 0, transform: "scale(0.85)" },
                    "70%": { transform: "scale(1.05)" },
                    "100%": { opacity: 1, transform: "scale(1)" },
                },
                "shimmer": {
                    from: { backgroundPosition: "200% 0" },
                    to: { backgroundPosition: "-200% 0" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-6px)" },
                },
                "float-slow": {
                    "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
                    "33%": { transform: "translateY(-12px) rotate(1deg)" },
                    "66%": { transform: "translateY(-6px) rotate(-1deg)" },
                },
                "float-delayed": {
                    "0%, 100%": { transform: "translateY(0) scale(1)" },
                    "50%": { transform: "translateY(-20px) scale(1.05)" },
                },
                "gradient-shift": {
                    "0%, 100%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                },
                "pulse-soft": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.7 },
                },
                "slide-right": {
                    from: { transform: "translateX(-100%)" },
                    to: { transform: "translateX(0)" },
                },
                "blob": {
                    "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
                    "50%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.3s ease-out",
                "slide-up": "slide-up 0.4s ease-out",
                "slide-down": "slide-down 0.3s ease-out",
                "scale-in": "scale-in 0.2s ease-out",
                "pop-in": "pop-in 0.25s ease-out",
                "shimmer": "shimmer 1.5s infinite",
                "float": "float 3s ease-in-out infinite",
                "float-slow": "float-slow 6s ease-in-out infinite",
                "float-delayed": "float-delayed 8s ease-in-out infinite",
                "gradient-shift": "gradient-shift 8s ease infinite",
                "pulse-soft": "pulse-soft 2s infinite",
                "slide-right": "slide-right 0.3s ease-out",
                "blob": "blob 7s ease-in-out infinite",
            },
            transitionDelay: {
                "100": "100ms",
                "200": "200ms",
                "300": "300ms",
                "400": "400ms",
                "500": "500ms",
            },
            boxShadow: {
                "soft": "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
                "soft-lg": "0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.05)",
                "glass": "0 8px 32px rgba(0, 0, 0, 0.06)",
                "glass-lg": "0 16px 48px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)",
                "glow-teal": "0 0 20px rgba(14, 165, 143, 0.15)",
                "glow-blue": "0 0 20px rgba(59, 130, 246, 0.15)",
                "glow-purple": "0 0 20px rgba(168, 85, 247, 0.15)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}

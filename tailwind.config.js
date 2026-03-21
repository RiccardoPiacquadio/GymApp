export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                ink: "#0a0a0a",
                panel: "rgba(255, 255, 255, 0.88)",
                mist: "#f3f3f3",
                accent: "#f97316",
                flare: "#fb923c",
                success: "#22c55e",
                danger: "#dc2626",
                steel: "#1a1a1a",
                chrome: "#a3a3a3",
                concrete: "rgba(0, 0, 0, 0.06)"
            },
            boxShadow: {
                panel: "0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
                "panel-lg": "0 12px 40px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.04)",
                nav: "0 -4px 30px rgba(0, 0, 0, 0.12)",
                glow: "0 0 20px rgba(249, 115, 22, 0.15)"
            },
            backgroundImage: {
                "app-glow": "radial-gradient(ellipse at 20% 0%, rgba(249, 115, 22, 0.14), transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(251, 146, 60, 0.08), transparent 40%), linear-gradient(180deg, #0a0a0a 0%, #141414 18%, #e8e8e8 22%, #f0f0f0 100%)"
            },
            borderRadius: {
                "2xl": "16px",
                "3xl": "24px",
                "4xl": "28px"
            },
            animation: {
                "slide-in-left": "slideInLeft 0.28s ease-out",
                "slide-in-right": "slideInRight 0.28s ease-out",
                flash: "flashGreen 0.6s ease-out",
                "fade-in": "fadeIn 0.2s ease-out",
                "scale-in": "scaleIn 0.2s ease-out"
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: "0" },
                    to: { opacity: "1" }
                },
                scaleIn: {
                    from: { opacity: "0", transform: "scale(0.96)" },
                    to: { opacity: "1", transform: "scale(1)" }
                }
            }
        }
    },
    plugins: []
};

export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                ink: "#090909",
                panel: "#ffffff",
                mist: "#efefef",
                accent: "#f97316",
                flare: "#fb923c",
                success: "#3f9b64",
                danger: "#c0392b",
                steel: "#262626",
                chrome: "#bdbdbd",
                concrete: "#e5e5e5"
            },
            boxShadow: {
                panel: "0 18px 45px rgba(9, 9, 9, 0.16)"
            },
            backgroundImage: {
                "app-glow": "radial-gradient(circle at top left, rgba(249, 115, 22, 0.2), transparent 32%), radial-gradient(circle at top right, rgba(251, 146, 60, 0.12), transparent 24%), linear-gradient(180deg, #090909 0%, #171717 20%, #f5f5f5 20%, #ebebeb 100%)"
            }
        }
    },
    plugins: []
};

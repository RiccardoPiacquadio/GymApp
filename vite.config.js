import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg", "icon-192.svg", "icon-512.svg"],
            manifest: {
                name: "GymApp Workout Tracker",
                short_name: "GymApp",
                description: "Workout tracker mobile-first offline-first per registrare allenamenti in palestra.",
                theme_color: "#0f172a",
                background_color: "#f8fafc",
                display: "standalone",
                start_url: "/",
                icons: [
                    {
                        src: "/icon-192.svg",
                        sizes: "192x192",
                        type: "image/svg+xml",
                        purpose: "any"
                    },
                    {
                        src: "/icon-512.svg",
                        sizes: "512x512",
                        type: "image/svg+xml",
                        purpose: "any maskable"
                    }
                ]
            }
        })
    ]
});

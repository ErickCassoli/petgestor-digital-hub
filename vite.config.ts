import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import vitePluginAdsense from "vite-plugin-adsense";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const adClientId = env.VITE_ADSENSE_CLIENT_ID || "ca-pub-1016463001156509";

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      adClientId &&
        vitePluginAdsense({
          adClient: adClientId,
          googleAdClient: adClientId,
          googleAdClientId: adClientId,
          includeInDev: false,
        }),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

export default function manifest() {
  return {
    name: "Veloce",
    short_name: "Veloce",
    description: "Tu contenido, organizado",
    start_url: "/",
    display: "standalone",
    background_color: "#060d1f",
    theme_color: "#060d1f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

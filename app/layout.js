import "./globals.css";

export const metadata = {
  title: "Veloce",
  description: "Tu contenido, organizado",
  appleWebApp: {
    capable: true,
    title: "Veloce",
    statusBarStyle: "black",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#060d1f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

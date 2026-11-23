import "./globals.css";

export const metadata = {
  title: "Veloce",
  description: "Contenido · en orden",
  icons: { icon: "/favicon.svg" },
};

export const viewport = { themeColor: "#0a0b0d" };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Instrument+Serif&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
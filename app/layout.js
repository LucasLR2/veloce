import "./globals.css";

export const metadata = {
  title: "Veloce",
  description: "Planificador personal de contenido diario",
};

export const viewport = {
  themeColor: "#0B1220",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "Notes on moonbase",
  description: "A small Next.js app with a managed database. An example project for moonbase.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

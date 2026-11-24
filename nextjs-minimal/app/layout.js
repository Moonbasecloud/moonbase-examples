import "./globals.css";

export const metadata = {
  title: "Next.js on moonbase",
  description: "A minimal Next.js app. An example project for moonbase.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

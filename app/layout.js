import "./globals.css";

export const metadata = {
  title: "Motion Only",
  description: "A private network for building momentum together.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

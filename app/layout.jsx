import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export const metadata = {
  title: "Kisaan Kareer",
  description: "Your field companion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="pb-24 min-h-screen bg-cream-50">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}

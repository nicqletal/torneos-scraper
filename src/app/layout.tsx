import type { Metadata } from "next";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { UserMenu } from "@/components/UserMenu";
import { ViewSwitch } from "@/components/ViewSwitch";
import { Footer } from "@/components/Footer";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas-neue",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Torneos Scraper | Plataforma de Fútbol Amateur",
  description: "Encuentra y organiza torneos de fútbol amateur en tu zona. Rendimiento, estadísticas y pasión amateur.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html 
      lang="es" 
      className={`${bebasNeue.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-bg text-foreground">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-secondary/90 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-sm bg-brand-lime flex items-center justify-center font-bold text-brand-bg shadow-sm transition-transform duration-200 group-hover:scale-105">
                <Trophy className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <span className="font-display text-2xl tracking-wider uppercase text-white group-hover:text-brand-lime transition-colors">
                Torneos Scraper
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              {!user && (
                <Link 
                  href="/login" 
                  className="text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-brand-lime transition-colors font-display"
                >
                  Iniciar sesión
                </Link>
              )}

              <ViewSwitch />

              {user && user.email && (
                <UserMenu email={user.email} />
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8 flex flex-col justify-start">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}

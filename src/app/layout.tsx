import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Trophy, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { UserMenu } from "@/components/UserMenu";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Torneos Scraper",
  description: "Encuentra torneos de fútbol amateur en tu zona",
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

  // If user is authenticated, click leads directly to /crear-torneo.
  // Otherwise, it redirects to login and then forwards to /crear-torneo.
  const loadTournamentPath = user ? "/crear-torneo" : "/login?next=/crear-torneo";

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground bg-mesh">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5 text-zinc-950" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">Torneos Scraper</span>
            </Link>
            
            <div className="flex items-center gap-4">
              {!user && (
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Iniciar sesión
                </Link>
              )}

              <Link 
                href={loadTournamentPath} 
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Cargar torneo
              </Link>

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

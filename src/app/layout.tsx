import type { Metadata } from "next";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { UserMenu } from "@/components/UserMenu";
import { Footer } from "@/components/Footer";
import { Atmosphere } from "@/components/Atmosphere";
import { AppFrame } from "@/components/AppFrame";
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

  // Solo decide si se muestra el link al Panel de administración: el acceso
  // real lo controlan el proxy y cada página de /admin con is_admin().
  const { data: isAdmin } = user ? await supabase.rpc('is_admin') : { data: false };

  // Barra mínima: sin sesión, un solo botón destacado ("Crear cuenta"); con
  // sesión, solo el menú de usuario. Ver "Cuenta y acceso" en
  // docs/decisiones-casos-de-uso.md.
  const navbar = (
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-sm bg-brand-lime flex items-center justify-center font-bold text-brand-bg shadow-sm transition-transform duration-200 group-hover:scale-105">
          <Trophy className="w-4.5 h-4.5 stroke-[2.5]" />
        </div>
        <span className="font-display text-2xl tracking-wider uppercase text-foreground group-hover:text-brand-lime transition-colors">
          Torneos Scraper
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {!user && (
          <>
            <Link
              href="/login"
              className="ui-action text-sm font-semibold uppercase tracking-wider text-foreground/70 hover:text-brand-lime transition-colors font-display"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login?modo=registro"
              className="ui-action inline-flex items-center px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-foreground text-brand-bg transition-colors duration-200 font-display shadow-sm"
            >
              Crear cuenta
            </Link>
          </>
        )}

        {user && user.email && (
          <UserMenu email={user.email} isAdmin={isAdmin === true} />
        )}
      </div>
    </div>
  );

  return (
    <html 
      lang="es" 
      className={`${bebasNeue.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="app-shell min-h-full flex flex-col bg-brand-bg text-foreground">
        <Atmosphere />
        {/* AppFrame solo saca la barra y el footer en /admin, que tiene su sidebar */}
        <AppFrame navbar={navbar} footer={<Footer />}>
          {children}
        </AppFrame>
      </body>
    </html>
  );
}

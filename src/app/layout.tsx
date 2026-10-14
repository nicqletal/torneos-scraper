import type { Metadata } from "next";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { Navbar } from "@/components/Navbar";
import { GUEST_COOKIE } from "@/utils/entry-navigation";
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

  const { data: isAdmin } = user ? await supabase.rpc('is_admin') : { data: false };
  const isGuest = !user && (await cookies()).get(GUEST_COOKIE)?.value === '1';

  return (
    <html 
      lang="es" 
      className={`${bebasNeue.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="app-shell min-h-full flex flex-col bg-brand-bg text-foreground">
        <Atmosphere />
        <AppFrame navbar={<Navbar email={user?.email} isAdmin={isAdmin === true} isGuest={isGuest} />} footer={<Footer />}>
          {children}
        </AppFrame>
      </body>
    </html>
  );
}

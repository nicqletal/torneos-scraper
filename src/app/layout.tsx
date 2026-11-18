import type { Metadata } from "next";
import { Bebas_Neue, Exo_2, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { UserMenu } from "@/components/UserMenu";
import { BrandMark } from "@/components/BrandMark";
import { MainNavigation } from '@/components/MainNavigation'
import { NoticeBell, type BellNotice } from "@/components/NoticeBell";
import { noticeDate, noticeLink, noticeText, type NoticeKind } from "@/utils/notices";
import { Footer } from "@/components/Footer";
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

const exo = Exo_2({
  weight: "700",
  variable: "--font-brand-name",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Matchmaking | Plataforma de Fútbol Amateur",
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

  // Solo decide si se muestra el enlace al Panel de administración: el acceso
  // real lo controlan el proxy y cada página de /admin con is_admin().
  const { data: isAdmin } = user ? await supabase.rpc('is_admin') : { data: false };

  // Campanita: los últimos 30 avisos y el total de no leídos. RLS ya filtra
  // a los del usuario; el texto se arma acá con `notices.ts`.
  let notices: BellNotice[] = [];
  let unreadCount = 0;
  let hasPendingAction = false
  if (user) {
    const [{ data: rows }, { count }] = await Promise.all([
      supabase
        .from('notices')
        .select('id, kind, params, created_at, read_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('notices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null),
    ]);
    notices = (rows ?? []).map((n) => ({
      id: n.id,
      text: noticeText(n.kind as NoticeKind, n.params),
      link: noticeLink(n.kind as NoticeKind, n.params),
      date: noticeDate(n.created_at),
      unread: n.read_at === null,
    }));
    unreadCount = count ?? 0;

    const [{ data: proposals }, { data: captainRows }, { data: matches }] = await Promise.all([
      supabase.from('proposal_details').select('to_team_id, status').eq('status', 'pendiente'),
      supabase.from('team_members').select('team_id').eq('user_id', user.id).eq('is_captain', true),
      supabase.from('match_details').select('phase, is_captain, start_at, deadline, going_at, venue, venue_start_at, venue_by_own, coordinated_at, mutual_drop_by_own, mutual_drop_answered_at, mutual_drop_reason, no_show_at, rival_no_show_at, goals_for, goals_against, rival_goals_for, rival_goals_against').eq('is_captain', true),
    ])

    const now = new Date()
    const captainTeamIds = new Set((captainRows ?? []).map((row) => row.team_id))
    const receivedProposal = (proposals ?? []).some((proposal) => captainTeamIds.has(proposal.to_team_id))
    hasPendingAction = receivedProposal || (matches ?? []).some((match) => {
      if (match.phase === 'por_jugarse') {
        const incomingCoordination = Boolean(match.venue && match.venue_start_at && !match.coordinated_at && match.venue_by_own === false)
        const confirmAttendance = match.deadline !== null && match.going_at === null && now.getTime() >= new Date(match.start_at).getTime() - 24 * 60 * 60 * 1000
        const answerMutualDrop = match.mutual_drop_by_own === false && match.mutual_drop_answered_at === null && match.mutual_drop_reason !== null && now < new Date(match.start_at)
        return incomingCoordination || confirmAttendance || answerMutualDrop
      }

      if (match.phase === 'esperando_resultado') {
        return match.rival_goals_for !== null || match.rival_no_show_at !== null
      }

      return false
    })
  }

  // Los módulos aparecen en MainNavigation según la sesión; los accesos de
  // cuenta y el Panel de organizador quedan en el menú de usuario.
  const navbar = (
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <Link href="/" className="flex flex-col items-center justify-center leading-none group">
        <div className="flex items-center transition-transform duration-200 group-hover:scale-105"><BrandMark className="h-7 w-9" /></div>
        <span className={`${exo.className} mt-0.5 text-sm leading-none tracking-tight text-foreground group-hover:text-brand-lime transition-colors`}>
          Matchmaking
        </span>
      </Link>

      <MainNavigation signedIn={Boolean(user)} hasPendingAction={hasPendingAction} />

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

        {user && <NoticeBell notices={notices} unreadCount={unreadCount} />}

        {user && user.email && (
          <UserMenu email={user.email} isAdmin={isAdmin === true} />
        )}
      </div>
    </div>
  );

  const themeBootstrap = `(function(){var root=document.documentElement;var path=window.location.pathname;if(path==='/admin'||path.indexOf('/admin/')===0)return;var theme;var density='normal';try{theme=window.localStorage.getItem('matchmaking-theme');var savedDensity=window.localStorage.getItem('matchmaking-density');if(savedDensity==='normal'||savedDensity==='amplia')density=savedDensity}catch(e){}if(theme!=='light'&&theme!=='dark')theme=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';root.dataset.theme=theme;root.dataset.density=density;})();`

  return (
    <html
      lang="es" 
      className={`${bebasNeue.variable} ${plusJakartaSans.variable} ${exo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="app-shell min-h-full flex flex-col bg-brand-bg text-foreground">
        {/* AppFrame solo saca la barra y el footer en /admin, que tiene su sidebar */}
        <AppFrame navbar={navbar} footer={<Footer showThemeToggle={!user} />} showMobileNav={Boolean(user)}>
          {children}
        </AppFrame>
      </body>
    </html>
  );
}

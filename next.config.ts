import type { NextConfig } from "next";

// Los flyers se sirven desde el bucket público `flyers` de nuestro Supabase.
const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: supabaseUrl.protocol === 'http:' ? 'http' : 'https',
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: '/storage/v1/object/public/flyers/**',
      },
      {
        protocol: supabaseUrl.protocol === 'http:' ? 'http' : 'https',
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: '/storage/v1/object/public/avatars/**',
      },
      {
        protocol: supabaseUrl.protocol === 'http:' ? 'http' : 'https',
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: '/storage/v1/object/public/team-crests/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      // El flyer viaja en el formulario del torneo, y puede pesar hasta 3 MB
      // (FLYER_MAX_BYTES). Por defecto el límite es 1 MB; se deja 1 MB de
      // margen para el resto de los campos y los bytes del multipart.
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;

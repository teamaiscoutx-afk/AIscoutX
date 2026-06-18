/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
      // !! WARNING !!
      // TypeScript errors ko build time par ignore karega taaki production live ho sake
      ignoreBuildErrors: true,
    },
    eslint: {
      // Eslint warning/errors ko bhi build ke waqt ignore karega
      ignoreDuringBuilds: true,
    },
  };
  
  export default nextConfig;
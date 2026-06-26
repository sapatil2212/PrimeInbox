import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these Node-only libraries out of the bundler so they load from
  // node_modules at runtime (pdfkit reads its font .afm files from disk).
  serverExternalPackages: ["pdfkit", "docx", "xlsx"],

  // Serve uploaded media (including legacy /uploads URLs) through the
  // /api/files route handler, which reads from the configured storage path.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/uploads/:path*", destination: "/api/files/:path*" },
      ],
    };
  },
};

export default nextConfig;
